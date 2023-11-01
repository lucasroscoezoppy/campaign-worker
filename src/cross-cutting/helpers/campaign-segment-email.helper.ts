import {
    Company,
    Campaign,
    MessageTemplateGroup,
    Address,
    Coupon,
    GiftbackConfig,
    LineItem,
    Message,
    MessageTypeEnum,
    Order,
    Product,
    User,
    ZoppyCoupon,
    BlacklistEmail,
    CampaignRecipient
} from '@ZoppyTech/models';
import { WcStatusConstants, MessageTemplateUtil, StringUtil, LogService } from '@ZoppyTech/utilities';
import { Op } from 'sequelize';
import { UnprocessableEntityException } from '@nestjs/common';
import { GetSellerHelper, MessageTemplateEntitiesResponse, EmailSender, Email } from '@ZoppyTech/shared';

export class CampaignSegmentEmailHelper {
    public static async execute(
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        messageTemplateGroup: MessageTemplateGroup
    ): Promise<void> {
        const email: string = campaignRecipient.contact;
        const blocked: BlacklistEmail = await BlacklistEmail.findOne({ where: { companyId: company.id, email: email } });

        if (blocked) throw new UnprocessableEntityException('Email bloqueado');

        let emailHtml: string = messageTemplateGroup.emailHtml;
        const emailSubject: string = messageTemplateGroup.emailSubject;

        const address: Address = await Address.findOne({ where: { companyId: company.id, email: email } });

        if (!address) throw new UnprocessableEntityException('Address not found');

        const order: Order = await Order.findOne({
            where: { companyId: company.id, billingId: address.id, status: WcStatusConstants.COMPLETED },
            order: [['createdAt', 'desc']]
        });

        const zoppyCoupon: ZoppyCoupon = order?.id
            ? await ZoppyCoupon.findOne({
                  where: { companyId: company.id, wcOrderId: order.id, code: { [Op.ne]: order.wcCouponCode } },
                  order: [['createdAt', 'desc']]
              })
            : null;

        const coupon: Coupon = zoppyCoupon
            ? await Coupon.findOne({ where: { companyId: company.id, code: zoppyCoupon.code }, order: [['createdAt', 'desc']] })
            : null;

        const giftback: GiftbackConfig = await GiftbackConfig.findOne({ where: { companyId: { [Op.eq]: company.id } } });

        const seller: User = await GetSellerHelper.execute(address);
        const lineItems: LineItem[] = await LineItem.findAll({ where: { orderId: order.id, companyId: company.id } });
        const products: Product[] = await Product.findAll({
            where: { companyId: company.id, id: lineItems.map((lineItem: LineItem) => lineItem.productId) }
        });

        const templateParamEntities: MessageTemplateEntitiesResponse = {
            clientAddress: address,
            company: company,
            coupon: coupon,
            giftbackConfig: giftback,
            lastPurchase: order,
            lastPurchaseProducts: products,
            seller: seller
        };

        emailHtml = MessageTemplateUtil.replaceLinks({
            content: emailHtml,
            companyId: company.id,
            email: address.email,
            couponCode: coupon.code
        });
        const template: string = MessageTemplateUtil.replaceParameters(emailHtml, templateParamEntities);
        const subject: string = MessageTemplateUtil.replaceParameters(emailSubject, templateParamEntities);

        const emailObject: Email = new Email();
        emailObject.recipient = {
            name: address.firstName,
            email: address.email
        };
        emailObject.images = {};
        emailObject.params = {};
        emailObject.subject = subject;
        emailObject.template = template;

        await Message.create({
            id: StringUtil.generateUuid(),
            type: MessageTypeEnum.EMAIL,
            count: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            companyId: company.id,
            campaignId: campaign?.id
        });

        await EmailSender.executeWithSemplate(emailObject, company.emailSender ?? process.env.SENDER_EMAIL);
        await LogService.info({ message: { message: 'Send Email', email: email } });
    }
}

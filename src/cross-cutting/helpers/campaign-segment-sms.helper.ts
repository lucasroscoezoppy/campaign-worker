import {
    Company,
    Campaign,
    MessageTemplate,
    Address,
    Order,
    ZoppyCoupon,
    Coupon,
    GiftbackConfig,
    User,
    LineItem,
    Product,
    CampaignRecipient
} from '@ZoppyTech/models';
import { WhatsappUtil, WcStatusConstants, MessageTemplateUtil, LogService } from '@ZoppyTech/utilities';
import { UnprocessableEntityException } from '@nestjs/common';
import { Op } from 'sequelize';
import { GetSellerHelper, MessageTemplateEntitiesResponse } from '@ZoppyTech/shared';
import { ZenviaSmsHelper } from '@ZoppyTech/zenvia';

export class CampaignSegmentSmsHelper {
    public static async execute(
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        messageTemplate: MessageTemplate
    ): Promise<void> {
        const phone: string = WhatsappUtil.getFullPhone(campaignRecipient.contact);

        const address: Address = await Address.findOne({
            where: {
                companyId: company.id,
                phone: WhatsappUtil.getPhoneWithoutCountryCode(phone)
            }
        });

        if (!address) throw new UnprocessableEntityException('Address not found');

        const order: Order = await Order.findOne({
            where: {
                companyId: company.id,
                billingId: address.id,
                status: WcStatusConstants.COMPLETED
            },
            order: [['createdAt', 'desc']]
        });

        const zoppyCoupon: ZoppyCoupon = order?.id
            ? await ZoppyCoupon.findOne({
                  where: {
                      companyId: company.id,
                      wcOrderId: order.id,
                      code: {
                          [Op.ne]: order.wcCouponCode
                      }
                  },
                  order: [['createdAt', 'desc']]
              })
            : null;

        const coupon: Coupon = zoppyCoupon
            ? await Coupon.findOne({
                  where: {
                      companyId: company.id,
                      code: zoppyCoupon.code
                  },
                  order: [['createdAt', 'desc']]
              })
            : null;

        const giftback: GiftbackConfig = await GiftbackConfig.findOne({
            where: {
                companyId: {
                    [Op.eq]: company.id
                }
            }
        });

        const seller: User = await GetSellerHelper.execute(address);
        const lineItems: LineItem[] = await LineItem.findAll({
            where: {
                orderId: order.id,
                companyId: company.id
            }
        });
        const products: Product[] = await Product.findAll({
            where: {
                companyId: company.id,
                id: lineItems.map((lineItem: LineItem) => lineItem.productId)
            }
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

        const template: string = MessageTemplateUtil.replaceParameters(messageTemplate.text, templateParamEntities);
        const fullPhone: string = WhatsappUtil.getFullPhone(address.phone);
        const messageId: string = await ZenviaSmsHelper.send({
            companyId: company.id,
            alertId: null,
            text: template,
            phone: fullPhone
        });

        await CampaignRecipient.update({ providerId: messageId }, { where: { id: campaignRecipient.id } });

        await LogService.info({
            message: {
                campaignId: campaign?.id,
                messageId: messageId,
                message: 'Send sms for phone',
                phone: phone
            }
        });
    }
}

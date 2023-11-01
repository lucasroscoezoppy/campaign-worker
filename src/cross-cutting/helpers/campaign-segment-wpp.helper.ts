import { Company, MessageTemplateGroup, Address, Order, ZoppyCoupon, CampaignRecipient } from '@ZoppyTech/models';
import { WhatsappUtil, WcStatusConstants, LogService } from '@ZoppyTech/utilities';
import { SendWppTemplateNotificationHelper } from '@ZoppyTech/whatsapp';
import { UnprocessableEntityException } from '@nestjs/common';
import { Op } from 'sequelize';

export class CampaignSegmentWppHelper {
    public static async execute(
        company: Company,
        campaignRecipient: CampaignRecipient,
        messageTemplateGroup: MessageTemplateGroup
    ): Promise<void> {
        const phone: string = WhatsappUtil.getFullPhone(campaignRecipient.contact);

        const address: Address = await Address.findOne({
            where: { companyId: company.id, phone: WhatsappUtil.getPhoneWithoutCountryCode(phone) }
        });

        if (!address) throw new UnprocessableEntityException('Address not found');

        const order: Order = await Order.findOne({
            where: { companyId: company.id, billingId: address.id, status: WcStatusConstants.COMPLETED },
            order: [['createdAt', 'desc']]
        });

        const zoppyCoupon: ZoppyCoupon = order.id
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

        await SendWppTemplateNotificationHelper.send({
            phone: phone,
            identifier: messageTemplateGroup.identifier,
            company: company,
            orderId: order?.id,
            couponCode: zoppyCoupon?.code
        });

        await LogService.info({ message: { message: 'Send message for phone', phone: phone } });
    }
}

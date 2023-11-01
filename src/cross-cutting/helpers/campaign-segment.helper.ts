import { Campaign, CampaignRecipient, Company, MessageTemplate, MessageTemplateGroup } from '@ZoppyTech/models';
import { CampaignStatusEnum, LogService } from '@ZoppyTech/utilities';
import { CampaignSegmentWppHelper } from './campaign-segment-wpp.helper';
import { CampaignSegmentSmsHelper } from './campaign-segment-sms.helper';
import { CampaignSegmentEmailHelper } from './campaign-segment-email.helper';
import { CampaignRecipientResponse } from '../response/campaign-recipient.response';

export class CampaignSegmentHelper {
    public static async process(
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        messageTemplateGroup: MessageTemplateGroup,
        messageTemplate: MessageTemplate
    ): Promise<void> {
        const response: CampaignRecipientResponse = await this.sendMessage(
            company,
            campaign,
            campaignRecipient,
            messageTemplateGroup,
            messageTemplate
        );

        await LogService.info({
            message: {
                message: 'Send message response',
                success: response.sucess,
                failed: response.fail
            }
        });

        await Campaign.update(
            {
                success: response.sucess ? [...campaign.success, response.sucess] : campaign.success,
                failed: response.fail ? [...campaign.failed, response.fail] : campaign.failed
            },
            {
                where: { id: campaign.id }
            }
        );
    }

    public static async sendMessage(
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        messageTemplateGroup: MessageTemplateGroup,
        messageTemplate: MessageTemplate
    ): Promise<CampaignRecipientResponse> {
        const response: CampaignRecipientResponse = {
            fail: null,
            sucess: null
        };

        try {
            switch (messageTemplateGroup.type) {
                case 'whatsapp':
                    await CampaignSegmentWppHelper.execute(company, campaignRecipient, messageTemplateGroup);
                    break;
                case 'sms':
                    await CampaignSegmentSmsHelper.execute(company, campaign, campaignRecipient, messageTemplate);
                    break;
                case 'email':
                    await CampaignSegmentEmailHelper.execute(company, campaign, campaignRecipient, messageTemplateGroup);
                    break;
            }
            response.sucess = campaignRecipient.contact;
            await CampaignRecipient.update({ status: CampaignStatusEnum.COMPLETED }, { where: { id: campaignRecipient.id } });
        } catch (error: any) {
            response.fail = campaignRecipient.contact;
            await CampaignRecipient.update(
                { errorMessage: error?.message ?? JSON.stringify(error ?? ''), status: CampaignStatusEnum.FAILED },
                { where: { id: campaignRecipient.id } }
            );
        }

        return response;
    }
}

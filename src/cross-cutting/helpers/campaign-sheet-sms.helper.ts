import { Company, Campaign, MessageTemplate, CampaignRecipient } from '@ZoppyTech/models';
import { WhatsappUtil, MessageTemplateUtil, StringUtil, LogService } from '@ZoppyTech/utilities';
import { CampaignSheetHelper, CampaignSheetItem } from './campaign-sheet.helper';
import { ZenviaSmsHelper } from '@ZoppyTech/zenvia';

export class CampaignSheetSmsHelper {
    public static async execute(
        item: CampaignSheetItem,
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        messageTemplate: MessageTemplate
    ): Promise<void> {
        const phone: string = WhatsappUtil.getFullPhone(item.phone);
        let text: string = messageTemplate.text;

        const params: string[] = MessageTemplateUtil.extractTemplateParameters(text);
        const paramValues: Array<string> = CampaignSheetHelper.replaceParams(MessageTemplateUtil.extractTemplateParameters(text), item);

        for (let i: number = 0; i < params.length; i++) text = StringUtil.replaceAll(text, `{{${params[i]}}}`, paramValues[i]);

        const messageId: string = await ZenviaSmsHelper.send({
            companyId: company.id,
            alertId: null,
            text: text,
            phone: phone
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

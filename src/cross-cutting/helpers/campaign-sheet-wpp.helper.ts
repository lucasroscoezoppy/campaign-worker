import { Company, WppAccount, MessageTemplate, WppMessageTemplate, WppAccountPhoneNumber } from '@ZoppyTech/models';
import { WhatsappUtil, MessageTemplateUtil, LogService } from '@ZoppyTech/utilities';
import { WhatsappMessageService } from '@ZoppyTech/whatsapp';
import { CampaignSheetHelper, CampaignSheetItem } from './campaign-sheet.helper';

export class CampaignSheetWppHelper {
    public static async execute(
        item: CampaignSheetItem,
        company: Company,
        wppAccount: WppAccount,
        messageTemplate: MessageTemplate,
        wppMessageTemplate: WppMessageTemplate
    ): Promise<void> {
        const phone: string = WhatsappUtil.getFullPhone(item.phone);
        const whatsappPhoneNumber: WppAccountPhoneNumber = await WppAccountPhoneNumber.findOne({
            where: { companyId: company.id, default: true }
        });

        const headerParamValues: Array<string> = CampaignSheetHelper.replaceParams(
            MessageTemplateUtil.extractTemplateParameters(wppMessageTemplate.headerMessage),
            item
        );
        const bodyParamValues: Array<string> = CampaignSheetHelper.replaceParams(
            MessageTemplateUtil.extractTemplateParameters(messageTemplate.text),
            item
        );

        await WhatsappMessageService.sendTemplateMessage(whatsappPhoneNumber.phoneNumberId, phone, wppAccount.accessToken, {
            wppName: wppMessageTemplate.wppName,
            headerParams: headerParamValues,
            textParams: bodyParamValues,
            headerType: wppMessageTemplate.type,
            fileUrl: `${process.env.API_URL}/api/download/wpp-message-templates/${wppMessageTemplate.id}/header`,
            hasHeader: !!wppMessageTemplate.headerMessage
        });

        await LogService.info({
            message: {
                message: 'Send message for phone',
                phone: phone
            }
        });
    }
}

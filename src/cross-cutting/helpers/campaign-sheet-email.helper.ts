import { BlacklistEmail, Campaign, Company, Message, MessageTemplateGroup, MessageTypeEnum } from '@ZoppyTech/models';
import { CampaignSheetHelper, CampaignSheetItem } from './campaign-sheet.helper';
import { LogService, MessageTemplateUtil, StringUtil } from '@ZoppyTech/utilities';
import { UnprocessableEntityException } from '@nestjs/common';
import { Email, EmailSender } from '@ZoppyTech/shared';

export class CampaignSheetEmailHelper {
    public static async execute(
        item: CampaignSheetItem,
        company: Company,
        campaign: Campaign,
        messageTemplateGroup: MessageTemplateGroup
    ): Promise<void> {
        const blocked: BlacklistEmail = await BlacklistEmail.findOne({
            where: {
                companyId: company.id,
                email: item.email
            }
        });

        if (blocked) throw new UnprocessableEntityException('Email bloqueado');

        let emailSubject: string = messageTemplateGroup.emailSubject;
        let emailHtml: string = messageTemplateGroup.emailHtml;

        const subjectParams: string[] = MessageTemplateUtil.extractTemplateParameters(emailSubject);
        const subjectParamValues: Array<string> = CampaignSheetHelper.replaceParams(
            MessageTemplateUtil.extractTemplateParameters(emailSubject),
            item
        );

        for (let i: number = 0; i < subjectParams.length; i++)
            emailSubject = StringUtil.replaceAll(emailSubject, `{{${subjectParams[i]}}}`, subjectParamValues[i]);

        emailHtml = emailHtml.replace(
            '{{unsubscribe}}',
            `<a href="${process.env.FRONTENT_URL}/blacklist/${item.email}/${company.id}" target="_blank">Caso não queira mais receber emails, clique aqui!</a>`
        );

        const bodyParams: string[] = MessageTemplateUtil.extractTemplateParameters(emailHtml);
        const bodyParamValues: Array<string> = CampaignSheetHelper.replaceParams(
            MessageTemplateUtil.extractTemplateParameters(emailHtml),
            item
        );

        for (let i: number = 0; i < bodyParams.length; i++)
            emailHtml = StringUtil.replaceAll(emailHtml, `{{${bodyParams[i]}}}`, bodyParamValues[i]);

        const emailObject: Email = {
            recipient: {
                name: item.client_first_name,
                email: item.email
            },
            images: {},
            params: {},
            subject: emailSubject,
            template: emailHtml
        };
        emailObject.recipient = {
            name: item.client_first_name,
            email: item.email
        };

        await EmailSender.executeWithSemplate(emailObject, company.emailSender ?? process.env.SENDER_EMAIL);

        await Message.create({
            id: StringUtil.generateUuid(),
            type: MessageTypeEnum.EMAIL,
            count: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            companyId: company.id,
            campaignId: campaign?.id
        });

        await LogService.info({
            message: {
                message: 'Send Campaign Email',
                phone: item.email
            }
        });
    }
}

import {
    Campaign,
    MessageTemplateGroup,
    WppAccount,
    WppMessageTemplate,
    MessageTemplate,
    Company,
    CampaignRecipient
} from '@ZoppyTech/models';
import { BlockFreeTierHelper } from '@ZoppyTech/shared';
import { CampaignStatusEnum } from '@ZoppyTech/utilities';

export class CampaignBase {
    public MAX_ATTEMPTS: number = 4;

    //#region Validations

    public async failWithoutWhatsappTemplate(
        campaign: Campaign,
        messageTemplateGroup: MessageTemplateGroup,
        accountFound: WppAccount,
        wppMessageTemplate: WppMessageTemplate
    ): Promise<boolean> {
        if (messageTemplateGroup.type === 'whatsapp' && (!accountFound || !wppMessageTemplate)) {
            await this.failCampaign(campaign, 'Whatsapp account not found or invalid');
            return;
        }
    }

    public async failWithoutTemplate(campaign: Campaign, messageTemplate: MessageTemplate): Promise<boolean> {
        if (!messageTemplate) {
            await this.failCampaign(campaign, 'Template deleted');
            return true;
        }

        return false;
    }

    public async failCompanyBlocked(company: Company, campaign: Campaign): Promise<boolean> {
        const companyBlocked: boolean = await BlockFreeTierHelper.execute(company, null);
        if (!company || companyBlocked) {
            await this.failCampaign(campaign, 'Company blocked');
            return true;
        }

        return false;
    }

    public async failWithoutGroup(campaign: Campaign, messageTemplateGroup: MessageTemplateGroup): Promise<boolean> {
        if (!messageTemplateGroup) {
            await this.failCampaign(campaign, 'Template deleted');
            return true;
        }

        return false;
    }

    //#endregion

    //#region Update Entities

    public async failCampaign(campaign: Campaign, error: any): Promise<void> {
        await Campaign.update(
            {
                attempts: this.MAX_ATTEMPTS,
                status: CampaignStatusEnum.FAILED,
                errorMessage: error?.message ?? JSON.stringify(error ?? '')
            },
            { where: { id: campaign.id } }
        );
    }

    public async failCampaignRecipient(campaign: Campaign, campaignRecipient: CampaignRecipient, error: any): Promise<void> {
        await Campaign.update(
            {
                failed: [...(campaign.failed ?? []), campaignRecipient.contact],
                errorMessage: error?.message ?? JSON.stringify(error ?? '')
            },
            { where: { id: campaign.id } }
        );
    }

    //#endregion

    public async fetchEntities(campaign: Campaign): Promise<CampaignEntities> {
        const accountFound: WppAccount = await WppAccount.findOne({ where: { active: true, companyId: campaign.companyId } });
        const messageTemplateGroup: MessageTemplateGroup = await MessageTemplateGroup.findByPk(campaign.messageTemplateGroupId);
        const messageTemplate: MessageTemplate = messageTemplateGroup
            ? await MessageTemplate.findOne({ where: { messageTemplateGroupId: messageTemplateGroup.id } })
            : null;
        const wppMessageTemplate: WppMessageTemplate = messageTemplateGroup
            ? await WppMessageTemplate.findOne({ where: { messageTemplateGroupId: messageTemplateGroup.id } })
            : null;

        return {
            accountFound,
            messageTemplateGroup,
            messageTemplate,
            wppMessageTemplate
        };
    }
}

export interface CampaignEntities {
    accountFound: WppAccount;
    messageTemplateGroup: MessageTemplateGroup;
    messageTemplate: MessageTemplate;
    wppMessageTemplate: WppMessageTemplate;
}

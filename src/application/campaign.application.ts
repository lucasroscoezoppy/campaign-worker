import { Campaign, CampaignRecipient, Company } from '@ZoppyTech/models';
import { CampaignStatusEnum, LogService } from '@ZoppyTech/utilities';
import { Injectable } from '@nestjs/common';
import { CampaignBase, CampaignEntities } from './campaign-base';
import { CampaignSheetHelper } from 'src/cross-cutting/helpers/campaign-sheet.helper';
import { CampaignSegmentHelper } from 'src/cross-cutting/helpers/campaign-segment.helper';

@Injectable()
export class CampaignApplication extends CampaignBase {
    public async execute(company: Company, campaign: Campaign, campaignRecipient: CampaignRecipient): Promise<CampaignRecipient> {
        await CampaignRecipient.update({ status: CampaignStatusEnum.PROCESSING }, { where: { id: campaignRecipient.id } });

        const entities: CampaignEntities = await this.fetchEntities(campaign);

        const failCompanyBlocked: boolean = await this.failCompanyBlocked(company, campaign);
        const failWithoutGroup: boolean = await this.failWithoutGroup(campaign, entities.messageTemplateGroup);
        const failWithoutTemplate: boolean = await this.failWithoutTemplate(campaign, entities.messageTemplate);
        const failWithoutWhatsappTemplate: boolean = await this.failWithoutWhatsappTemplate(
            campaign,
            entities.messageTemplateGroup,
            entities.accountFound,
            entities.wppMessageTemplate
        );

        if (failCompanyBlocked || failWithoutGroup || failWithoutTemplate || failWithoutWhatsappTemplate) {
            await CampaignRecipient.update({ status: CampaignStatusEnum.FAILED }, { where: { id: campaignRecipient.id } });
            return null;
        }

        try {
            await Campaign.update({ sentAt: new Date(), status: CampaignStatusEnum.PROCESSING }, { where: { id: campaign.id } });
            if (campaign.file) {
                await CampaignSheetHelper.process(
                    company,
                    campaign,
                    campaignRecipient,
                    entities.accountFound,
                    entities.messageTemplateGroup,
                    entities.messageTemplate,
                    entities.wppMessageTemplate
                );
                return;
            } else if (campaign.segmentId) {
                await CampaignSegmentHelper.process(
                    company,
                    campaign,
                    campaignRecipient,
                    entities.messageTemplateGroup,
                    entities.messageTemplate
                );
                return;
            } else {
                await this.failCampaign(campaign, 'Campaign without file or segment, wrong configurations');
                return;
            }
        } catch (error) {
            await CampaignRecipient.update(
                { errorMessage: error?.message ?? JSON.stringify(error ?? ''), status: CampaignStatusEnum.FAILED },
                { where: { id: campaignRecipient.id } }
            );
        }
    }
}

import { MessageConsumer, MessageConsumerFactory } from '@ZoppyTech/message-broker';
import { Campaign, CampaignRecipient, Company, ScheduledWcCoupon } from '@ZoppyTech/models';
import { CampaignStatusEnum, StringUtil } from '@ZoppyTech/utilities';
import { Injectable } from '@nestjs/common';
import { Channel, ConsumeMessage } from 'amqplib';
import { CampaignApplication } from 'src/application/campaign.application';
import { TimeUtil } from 'src/util/time.util';

@Injectable()
export class CampaignProcess {
    private CAMPAIGN_QUEUE_NAME: string = process.env.CAMPAIGN_QUEUE_NAME;

    public constructor(private readonly application: CampaignApplication) {}

    public async init(): Promise<void> {
        const consumer: MessageConsumer = MessageConsumerFactory.create();
        try {
            await consumer.connect();
            await consumer.afterChannelInit(async (channel: Channel) => {
                await channel.assertQueue(this.CAMPAIGN_QUEUE_NAME, {
                    durable: true
                });
                await channel.prefetch(1);
            });
            await consumer.receiveFromQueue(this.CAMPAIGN_QUEUE_NAME, async (message: ConsumeMessage) => {
                await this.processMessage(message);
            });
            console.log(`[${TimeUtil.now()}]: Waiting for messages in %s. To exit press CTRL+C`, this.CAMPAIGN_QUEUE_NAME);
        } catch (error: any) {
            console.log(`[${TimeUtil.now()}]: ${error}`);
            await consumer.disconnect();
        }
    }

    private async processMessage(message: ConsumeMessage): Promise<void> {
        const requestMessage: CampaignRequestMessage = JSON.parse(message.content.toString());
        const recipientId: string = requestMessage.campaignRecipientId ?? StringUtil.generateUuid();
        const campaignRecipient: CampaignRecipient = await CampaignRecipient.findByPk(recipientId);
        if (!campaignRecipient || campaignRecipient.status === CampaignStatusEnum.COMPLETED) return;
        const campaign: Campaign = await Campaign.findByPk(campaignRecipient.campaignId);
        const company: Company = await Company.findByPk(campaignRecipient.companyId);
        await this.application.execute(company, campaign, campaignRecipient);
    }
}

export interface CampaignRequestMessage {
    campaignRecipientId: string;
}

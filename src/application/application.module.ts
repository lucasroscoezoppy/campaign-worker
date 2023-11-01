import { Module } from '@nestjs/common';
import { CampaignApplication } from './campaign.application';

@Module({
    imports: [],
    providers: [CampaignApplication],
    exports: [CampaignApplication]
})
export class ApplicationModule {}

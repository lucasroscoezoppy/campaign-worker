import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { CampaignProcess } from './campaign.process';

@Module({
    imports: [ApplicationModule],
    providers: [CampaignProcess],
    exports: [CampaignProcess]
})
export class ProcessModule {}

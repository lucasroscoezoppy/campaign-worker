import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { CampaignProcess } from './process/campaign.process';

dotenv.config();

async function bootstrap() {
    const app: INestApplicationContext = await NestFactory.createApplicationContext(AppModule);
    const process: CampaignProcess = app.get(CampaignProcess);
    await process.init();
}
bootstrap();

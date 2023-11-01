import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { AppController } from './controller/app.controller';
import { ProcessModule } from './process/process.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env'],
            isGlobal: true
        }),
        DatabaseModule,
        ProcessModule
    ],
    controllers: [AppController],
    providers: [],
    exports: []
})
export class AppModule {}

import { databaseProvider } from './database.provider';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    exports: [...databaseProvider],
    controllers: [],
    providers: [...databaseProvider]
})
export class DatabaseModule {}

import { Sequelize } from 'sequelize-typescript';
import { Dialect } from 'sequelize/types';
import { AppConstants } from '@ZoppyTech/utilities';
import {
    AbandonedCart,
    AbcValue,
    Address,
    BlacklistEmail,
    Campaign,
    CampaignRecipient,
    Company,
    Coupon,
    CouponAlert,
    Customer,
    DataNotSynced,
    DataSyncManagement,
    DataSyncManagementProviderEntity,
    ErpKey,
    ExternalToken,
    Feature,
    GiftbackConfig,
    Invoice,
    Key,
    Lead,
    LineItem,
    Message,
    MessageTemplate,
    MessageTemplateGroup,
    Nps,
    Order,
    PasswordToken,
    PaymentMethod,
    ProcessDataManagement,
    Product,
    RefreshToken,
    RfmLimit,
    ScheduledWcCoupon,
    StatusMap,
    Store,
    SyncDataEvent,
    SyncErpDataEvent,
    SyncWppTemplate,
    Task,
    User,
    ViewContact,
    ViewCustomer,
    ViewSalesPanel,
    ViewSegmentData,
    VindiError,
    WebhookResponse,
    WppAccount,
    WppAccountManager,
    WppAccountPhoneNumber,
    WppContact,
    WppContactTag,
    WppConversation,
    WppMediaMessage,
    WppMessage,
    WppMessageTemplate,
    WppTag,
    ZoppyClientCoupon,
    ZoppyCoupon
} from '@ZoppyTech/models';

export const databaseProvider: any = [
    {
        provide: 'SEQUELIZE',
        useFactory: async () => {
            const SequelizeConnection: Sequelize = new Sequelize(process.env.DB_SCHEMA, process.env.DB_USER, process.env.DB_PASSWORD, {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT),
                dialect: process.env.DB_TYPE as Dialect,
                logging: [AppConstants.NODE_ENV.LOCAL, AppConstants.NODE_ENV.TEST].includes(process.env.NODE_ENV) ? console.log : false,
                pool: {
                    max: 100,
                    min: 0,
                    acquire: 60000,
                    idle: 10000
                }
            });
            SequelizeConnection.addModels([
                AbandonedCart,
                AbcValue,
                Address,
                BlacklistEmail,
                Campaign,
                CampaignRecipient,
                Company,
                Coupon,
                CouponAlert,
                Customer,
                DataNotSynced,
                DataSyncManagement,
                DataSyncManagementProviderEntity,
                ErpKey,
                ExternalToken,
                Feature,
                GiftbackConfig,
                Invoice,
                Key,
                Lead,
                LineItem,
                Message,
                MessageTemplate,
                MessageTemplateGroup,
                Nps,
                Order,
                PasswordToken,
                PaymentMethod,
                ProcessDataManagement,
                Product,
                RefreshToken,
                RfmLimit,
                ScheduledWcCoupon,
                StatusMap,
                Store,
                SyncDataEvent,
                SyncErpDataEvent,
                SyncWppTemplate,
                Task,
                User,
                ViewContact,
                ViewCustomer,
                ViewSalesPanel,
                ViewSegmentData,
                VindiError,
                WebhookResponse,
                WppAccount,
                WppAccountManager,
                WppAccountPhoneNumber,
                WppContact,
                WppContactTag,
                WppConversation,
                WppMediaMessage,
                WppMessage,
                WppMessageTemplate,
                WppTag,
                ZoppyClientCoupon,
                ZoppyCoupon
            ]);
            return SequelizeConnection;
        }
    }
];

import {
    Address,
    Campaign,
    CampaignRecipient,
    Company,
    Customer,
    MessageTemplate,
    MessageTemplateGroup,
    WppAccount,
    WppContact,
    WppMessageTemplate
} from '@ZoppyTech/models';
import {
    CampaignStatusEnum,
    FormatUtils,
    LogService,
    MessageTemplateConstants,
    PhoneNumberSliced,
    StringUtil,
    WhatsappUtil
} from '@ZoppyTech/utilities';
import { CampaignSheetWppHelper } from './campaign-sheet-wpp.helper';
import { CampaignSheetSmsHelper } from './campaign-sheet-sms.helper';
import { CampaignSheetEmailHelper } from './campaign-sheet-email.helper';
import { CampaignRecipientResponse } from '../response/campaign-recipient.response';

export class CampaignSheetHelper {
    public static async process(
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        accountFound: WppAccount,
        messageTemplateGroup: MessageTemplateGroup,
        messageTemplate: MessageTemplate,
        wppMessageTemplate: WppMessageTemplate
    ): Promise<void> {
        const item: CampaignSheetItem = this.formatContent(campaignRecipient.information);

        await LogService.info({ message: { message: 'format content', item: item } });

        const contact: InsertContactResponse = await this.insertContact(item, company);

        await LogService.info({
            message: {
                message: 'insert contact',
                customer: contact?.customer?.get(),
                addresse: contact?.address?.get(),
                wppContact: contact?.wppContact?.get()
            }
        });

        const response: CampaignRecipientResponse = await this.sendMessage(
            item,
            company,
            campaign,
            campaignRecipient,
            accountFound,
            messageTemplateGroup,
            messageTemplate,
            wppMessageTemplate
        );

        await LogService.info({
            message: {
                message: 'Send message response',
                success: response.sucess,
                failed: response.fail
            }
        });

        await Campaign.update(
            {
                success: response.sucess ? [...campaign.success, response.sucess] : campaign.success,
                failed: response.fail ? [...campaign.failed, response.fail] : campaign.failed
            },
            {
                where: { id: campaign.id }
            }
        );
    }

    public static replaceParams(params: string[], item: CampaignSheetItem): string[] {
        const paramValues: string[] = [];

        for (const param of params) {
            switch (param) {
                case MessageTemplateConstants.PARAMETERS.AGE:
                case MessageTemplateConstants.PARAMETERS.BIRTHDAY_DAY:
                case MessageTemplateConstants.PARAMETERS.BIRTHDAY_MONTH:
                case MessageTemplateConstants.PARAMETERS.COMPANY_NAME:
                case MessageTemplateConstants.PARAMETERS.GIFTBACK_CODE:
                case MessageTemplateConstants.PARAMETERS.NPS_LINK:
                case MessageTemplateConstants.PARAMETERS.NPS_PRODUCT_RATING:
                case MessageTemplateConstants.PARAMETERS.SELLER_NAME:
                case MessageTemplateConstants.PARAMETERS.STORE_URL:
                case MessageTemplateConstants.PARAMETERS.PRODUCT_LIST:
                case MessageTemplateConstants.PARAMETERS.NPS_RATING:
                case MessageTemplateConstants.PARAMETERS.NPS_SERVICE_RATING:
                    paramValues.push(item[param]);
                    break;
                case MessageTemplateConstants.PARAMETERS.CLIENT_FIRST_NAME:
                case MessageTemplateConstants.PARAMETERS.CLIENT_LAST_NAME:
                    paramValues.push(StringUtil.formatName(item[param]));
                    break;
                case MessageTemplateConstants.PARAMETERS.GIFTBACK_AMOUNT:
                case MessageTemplateConstants.PARAMETERS.GIFTBACK_MINIMUM_PURCHASE_VALUE:
                    paramValues.push(FormatUtils.toCurrency(parseFloat(item[param] ?? 0)));
                    break;
                case MessageTemplateConstants.PARAMETERS.GIFTBACK_EXPIRY_DATE:
                case MessageTemplateConstants.PARAMETERS.LAST_PURCHASE_DATE:
                    paramValues.push(item[param]);
                    break;
                case MessageTemplateConstants.PARAMETERS.GIFTBACK_PERCENT_VALUE:
                    paramValues.push(FormatUtils.toPercent(parseFloat(item[param] ?? 0)));
                    break;
            }
        }

        return paramValues;
    }

    public static async insertContact(item: CampaignSheetItem, company: Company): Promise<InsertContactResponse> {
        let wppContact: WppContact = null;
        let address: Address = null;
        let customer: Customer = null;

        const valid: boolean = WhatsappUtil.isValidPhone(item.phone);
        if (!valid) return null;

        const exists: WppContact = await WppContact.findOne({
            where: { companyId: company.id, phone: WhatsappUtil.getPhoneWithoutCountryCode(item.phone) }
        });

        const slicedPhone: PhoneNumberSliced = WhatsappUtil.slicePhone(item.phone);

        wppContact =
            exists ??
            (await WppContact.create({
                id: StringUtil.generateUuid(),
                phone: WhatsappUtil.getPhoneWithoutCountryCode(item.phone),
                firstName: item.client_first_name,
                lastName: item.client_last_name,
                countryCode: slicedPhone.countryCode,
                subdivisionCode: slicedPhone.subdivisionCode,
                companyId: company.id,
                isBlocked: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

        address = item.phone
            ? await Address.findOne({ where: { companyId: company.id, phone: WhatsappUtil.getPhoneWithoutCountryCode(item.phone) } })
            : await Address.findOne({ where: { companyId: company.id, email: item.email ?? StringUtil.generateUuid() } });

        if (!address) {
            const addressId: string = StringUtil.generateUuid();
            address = await Address.create({
                id: addressId,
                phone: WhatsappUtil.getPhoneWithoutCountryCode(item.phone),
                email: item.email,
                firstName: item.client_first_name,
                lastName: item.client_last_name,
                companyId: company.id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            customer = await Customer.create({
                id: StringUtil.generateUuid(),
                phone: WhatsappUtil.getPhoneWithoutCountryCode(item.phone),
                firstName: item.client_first_name,
                lastName: item.client_last_name,
                billingId: addressId,
                shippingId: addressId,
                companyId: company.id,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else customer = await Customer.findOne({ where: { billingId: address.id } });

        return {
            wppContact: wppContact,
            address: address,
            customer: customer
        };
    }

    public static formatContent(info: any): CampaignSheetItem {
        const item: CampaignSheetItem = new CampaignSheetItem();

        for (const prop in info) {
            if (prop.includes(MessageTemplateConstants.PARAMETERS.AGE)) item.age = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.BIRTHDAY_DAY)) item.birthday_day = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.BIRTHDAY_MONTH)) item.birthday_month = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.CLIENT_FIRST_NAME)) item.client_first_name = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.CLIENT_LAST_NAME)) item.client_last_name = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.COMPANY_NAME)) item.company_name = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.GIFTBACK_AMOUNT)) item.giftback_amount = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.GIFTBACK_CODE)) item.giftback_code = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.GIFTBACK_EXPIRY_DATE)) item.giftback_expiry_date = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.GIFTBACK_MINIMUM_PURCHASE_VALUE))
                item.giftback_minimum_purchase_value = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.GIFTBACK_PERCENT_VALUE)) item.giftback_percent_value = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.LAST_PURCHASE_DATE)) item.last_purchase_date = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.NPS_LINK)) item.nps_link = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.NPS_PRODUCT_RATING)) item.nps_product_rating = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.NPS_RATING)) item.nps_rating = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.NPS_SERVICE_RATING)) item.nps_service_rating = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.PRODUCT_LIST)) item.product_list = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.SELLER_NAME)) item.seller_name = info[prop];
            if (prop.includes(MessageTemplateConstants.PARAMETERS.STORE_URL)) item.store_url = info[prop];
            if (prop.includes('phone')) item.phone = info[prop];
            if (prop.includes('email')) item.email = info[prop];
        }

        return item;
    }

    public static async sendMessage(
        item: CampaignSheetItem,
        company: Company,
        campaign: Campaign,
        campaignRecipient: CampaignRecipient,
        wppAccount: WppAccount,
        messageTemplateGroup: MessageTemplateGroup,
        messageTemplate: MessageTemplate,
        wppMessageTemplate: WppMessageTemplate
    ): Promise<CampaignRecipientResponse> {
        const response: CampaignRecipientResponse = {
            fail: null,
            sucess: null
        };

        const identifier: string = item.phone ? item.phone : item.email;
        try {
            switch (messageTemplateGroup.type) {
                case 'whatsapp':
                    await CampaignSheetWppHelper.execute(item, company, wppAccount, messageTemplate, wppMessageTemplate);
                    break;
                case 'sms':
                    await CampaignSheetSmsHelper.execute(item, company, campaign, campaignRecipient, messageTemplate);
                    break;
                case 'email':
                    await CampaignSheetEmailHelper.execute(item, company, campaign, messageTemplateGroup);
                    break;
            }
            response.sucess = identifier;
            await CampaignRecipient.update({ status: CampaignStatusEnum.COMPLETED }, { where: { id: campaignRecipient.id } });
        } catch (error: any) {
            response.fail = identifier;
            await CampaignRecipient.update(
                { errorMessage: error?.message ?? JSON.stringify(error ?? ''), status: CampaignStatusEnum.FAILED },
                { where: { id: campaignRecipient.id } }
            );
        }

        return response;
    }
}

export class CampaignSheetItem {
    public declare age: string;
    public declare birthday_day: string;
    public declare birthday_month: string;
    public declare client_first_name: string;
    public declare client_last_name: string;
    public declare company_name: string;
    public declare giftback_amount: string;
    public declare giftback_code: string;
    public declare giftback_expiry_date: string;
    public declare giftback_minimum_purchase_value: string;
    public declare giftback_percent_value: string;
    public declare last_purchase_date: string;
    public declare nps_link: string;
    public declare nps_product_rating: string;
    public declare nps_rating: string;
    public declare nps_service_rating: string;
    public declare product_list: string;
    public declare seller_name: string;
    public declare store_url: string;
    public declare phone: string;
    public declare email: string;
}

export interface InsertContactResponse {
    customer: Customer;
    address: Address;
    wppContact: WppContact;
}

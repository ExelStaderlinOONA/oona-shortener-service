import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { loggingAspectClass } from '/opt/nodejs/loggingAspect';
import { createLogger } from '/opt/nodejs/loggerUtil';
import { ShortenerRequest } from 'src/dto/request/shortener-request';
import { ShortenerResponse } from 'src/dto/response/shortener-response';
import { LambdaResponse } from 'src/dto/response/lambda-response';
import { MyDataSource } from 'src/config/data-source.config';
import { ShortenerUrl } from 'src/entity/shorterner.entity';
import { APP_VERSION, APP_DOMAIN } from 'src/utils/constant';
import { formatStringToDate, formatDateToString } from 'src/utils/date-util';
import { isEmpty, isNotEmpty } from 'src/utils/string-util';
import { BadRequestError, ExpiredError } from 'src/exceptions/error-exception';
import { BaseService } from 'src/service/base-service';
// import * as dotenv from 'dotenv';

// dotenv.config(); //i don't know why this dotenv doesn't load .env file.
const logger = createLogger();

const shortenerUrlRepository = MyDataSource.getRepository(ShortenerUrl);

class ShortenerService extends BaseService {
    async getApplicationVersion(): Promise<LambdaResponse> {
        return await this.baseResponse(200, `Shortener service version ${APP_VERSION}`);
    }

    @loggingAspectClass
    async getTheLongUrl(event: any): Promise<LambdaResponse> {
        try {
            const shortUrlId = event.pathParameters?.shortUrlId;
            if (!shortUrlId) {
                throw new BadRequestError('Short URL is not provided.');
            }

            //Check if the short url id is exist in database
            const shortenerUrl = await shortenerUrlRepository.findOneBy({ shortUrlId: shortUrlId });
            if (!shortenerUrl) {
                throw new BadRequestError(`Short URL ID is not found: ${shortUrlId}`);
            }

            //Check if the expiredDate is not null and the date is not expired
            if (shortenerUrl.expiredDate && shortenerUrl.expiredDate < new Date()) {
                logger.error(`Expired Date: ${formatDateToString(shortenerUrl.expiredDate)}`);
                throw new ExpiredError('Short URL is expired.');
            }

            return await this.redirectResponse(shortenerUrl.longUrl);
        } catch (err) {
            return await this.handlingErrorResponse(err);
        }
    }

    @loggingAspectClass
    async proceessTheUrl(event: any): Promise<LambdaResponse> {
        try {
            logger.info('Request Event: ', event);

            const apiRequestPayload: ShortenerRequest = new ShortenerRequest();
            await this.assignAnyToObject(apiRequestPayload, event.body);

            if (isEmpty(apiRequestPayload.url)) {
                throw new BadRequestError('URL is not provided.');
            }

            const apiResponsePayload: ShortenerResponse = new ShortenerResponse();
            //Check if the shortener url is custom
            if (apiRequestPayload.isCustom) {
                const customUrl = await this.createCustomUrl(
                    apiRequestPayload.url,
                    apiRequestPayload.customId,
                    apiRequestPayload.expiredDate,
                );
                apiResponsePayload.customUrl = customUrl;
            } else {
                //Create the short url.
                const hashToken = await this.hashLongUrl(apiRequestPayload.url);
                const shortenUrl = await this.createShortenUrl(
                    apiRequestPayload.url,
                    hashToken,
                    apiRequestPayload.expiredDate,
                );
                apiResponsePayload.shortenUrl = shortenUrl;
            }

            apiResponsePayload.longUrl = apiRequestPayload.url;
            apiResponsePayload.expiredDate = apiRequestPayload.expiredDate;

            return await this.baseResponseData(200, apiResponsePayload, 'Success operation');
        } catch (err) {
            return await this.handlingErrorResponse(err);
        }
    }

    private async hashLongUrl(url: string) {
        // Extract the token of the URL
        // const urlToken = url.split('/').pop();
        // if (!urlToken) {
        //     throw new BadRequestError('Invalid URL');
        // }

        // Create a SHA-256 hash of the last segment
        const hash = createHash('sha256');
        hash.update(url);
        const hashedValue = hash.digest('hex');

        logger.info(`longUrl: ${url} -> hash: ${hashedValue}`);

        // substring first 7 character
        return hashedValue.substring(0, 7);
    }

    private async createCustomUrl(longUrl: string, customId: string, expiredDate: string) {
        // validate the customId
        this.validateCustomId(customId);

        //check if the customId is already in the database.
        const shortenerUrl = await this.getShortenerUrlByShortUrlId(customId);
        if (shortenerUrl) {
            throw new BadRequestError('Custom URL is not available.');
        }

        const shortUrl = APP_DOMAIN + customId;

        // save the record to database.
        await this.saveShortenUrl(longUrl, shortUrl, customId, expiredDate);

        return shortUrl;
    }

    private validateCustomId(customId: string): void {
        /* this regex will check if first & last character is alphabet or number,
        and only allow alphabet, number, and dash character */
        const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/;
        const allowedLength = 30;
        if (isEmpty(customId)) {
            throw new BadRequestError('customId is empty. please check your payload');
        }
        if (!regex.test(customId)) {
            throw new BadRequestError('Invalid customId format, example format: my-custom-id-123');
        }
        if (customId.length > allowedLength) {
            throw new BadRequestError(`customId length is too long. allowedLength: ${allowedLength}`);
        }
    }

    private async createShortenUrl(longUrl: string, hashToken: string, expiredDate: string) {
        // Extract the token of the URL
        // const urlToken = longUrl.split('/').pop() || ''; //This is a safeguard to avoid returning undefined.
        // const shortUrl = longUrl.replace(urlToken, hashToken);

        let shortUrl = APP_DOMAIN + hashToken;
        let shortenerUrl = await this.getShortenerUrlByShortUrl(shortUrl);

        //check if the shortUrl is already in the database.
        while (shortenerUrl) {
            logger.info(
                `checkShortUrlInDatabase --> shortUrl: ${shortUrl} is already in the database, re-generating new token`,
            );
            hashToken = uuidv4().slice(0, 7);
            shortUrl = APP_DOMAIN + hashToken;
            shortenerUrl = await this.getShortenerUrlByShortUrl(shortUrl);
        }

        // save the record to database.
        await this.saveShortenUrl(longUrl, shortUrl, hashToken, expiredDate);

        return shortUrl;
    }

    private async getShortenerUrlByShortUrl(shortUrl: string): Promise<ShortenerUrl | null> {
        return await shortenerUrlRepository.findOneBy({ shortUrl: shortUrl });
    }

    private async getShortenerUrlByShortUrlId(customId: string): Promise<ShortenerUrl | null> {
        return await shortenerUrlRepository.findOneBy({ shortUrlId: customId });
    }

    private async saveShortenUrl(longUrl: string, shortUrl: string, shortUrlId: string, expiredDate: string) {
        //save the shortenerUrl to database.
        logger.info(`saveShortenUrl --> shortUrl: ${shortUrl} , longUrl: ${longUrl}, shortUrlId: ${shortUrlId}`);
        const shortenerUrl = new ShortenerUrl();
        shortenerUrl.longUrl = longUrl;
        shortenerUrl.shortUrl = shortUrl;
        shortenerUrl.shortUrlId = shortUrlId;
        shortenerUrl.createdDate = new Date();
        //ternary operator to check if the expiredDate is not empty.
        shortenerUrl.expiredDate = expiredDate ? formatStringToDate(expiredDate) : null;
        await shortenerUrlRepository.save(shortenerUrl);
    }
}

export default ShortenerService;

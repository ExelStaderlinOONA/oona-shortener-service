import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { loggingAspectClass } from '/opt/nodejs/loggingAspect';
import { createLogger } from '/opt/nodejs/loggerUtil';
import { ShortenerRequest } from 'src/dto/request/shortener-request';
import { ShortenerResponse } from 'src/dto/response/shortener-response';
import { BaseResponse } from 'src/dto/response/base-response';
import { LambdaResponse } from 'src/dto/response/lambda-response';
import { MyDataSource } from 'src/config/data-source.config';
import { ShortenerUrl } from 'src/entity/shorterner.entity';
import { APP_VERSION, APP_DOMAIN } from 'src/util/constant';
import { BadRequestError } from 'src/exceptions/bad-request-error';
// import * as dotenv from 'dotenv';

// dotenv.config(); //i don't know why this dotenv doesn't load .env file.
const logger = createLogger();

const shortenerUrlRepository = MyDataSource.getRepository(ShortenerUrl);

class ShortenerService {
    async getApplicationVersion(): Promise<LambdaResponse> {
        return await this.baseResponse(200, `Shortener service version ${APP_VERSION}`);
    }

    @loggingAspectClass
    async proceessTheUrl(event: any): Promise<LambdaResponse> {
        let apiCallResponse;
        try {
            logger.info('Request Event: ', event);

            const apiRequestPayload: ShortenerRequest = new ShortenerRequest();
            await this.assignAnyToObject(apiRequestPayload, event.body);

            if (!apiRequestPayload.url) {
                throw new BadRequestError('URL is not provided.');
            }

            const apiResponsePayload: ShortenerResponse = new ShortenerResponse();
            //Check if the shortener url is custom
            if (apiRequestPayload.isCustom) {
                const customUrl = await this.createCustomUrl(apiRequestPayload.url, apiRequestPayload.customUrl);
                apiResponsePayload.customUrl = customUrl;
            } else {
                //Create the short url.
                const hashToken = await this.hashLongUrl(apiRequestPayload.url);
                const shortenUrl = await this.createShortenUrl(apiRequestPayload.url, hashToken);
                apiResponsePayload.shortenUrl = shortenUrl;
            }

            apiResponsePayload.longUrl = apiRequestPayload.url;
            apiResponsePayload.expiredTime = apiRequestPayload.expiredTime;

            apiCallResponse = await this.baseResponseData(200, apiResponsePayload, 'Success operation');
            return apiCallResponse;
        } catch (err) {
            if (err instanceof BadRequestError) {
                logger.error(`Error: ${err.message}`, err);
                return await this.baseResponse(400, `Bad Request: ${err.message}`);
            } else if (err instanceof Error) {
                logger.error(`Error: ${err.message}`, err);
                return await this.baseResponse(500, `Internal Server Error: ${err.message}`);
            } else {
                const errorMessage = 'An unknown error occurred.';
                return await this.baseResponse(500, `Internal Server Error: ${errorMessage}`);
            }
        }
    }

    private async assignAnyToObject(object: any, payload: any) {
        try {
            Object.assign(object, JSON.parse(payload));
        } catch {
            Object.assign(object, JSON.parse(JSON.stringify(payload)));
        }
        logger.info(`objectPayload : ${JSON.stringify(object)}`);
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

    private async createCustomUrl(longUrl: string, customUrl: string) {
        const shortenerUrl = await this.getShortenerUrlByCustomUrl(customUrl);
        if (shortenerUrl) {
            throw new BadRequestError('Custom URL is not available.');
        }
        await this.saveShortenUrl(longUrl, null, customUrl);
        return customUrl;
    }

    private async createShortenUrl(longUrl: string, hashToken: string) {
        // Extract the token of the URL
        // const urlToken = longUrl.split('/').pop() || ''; //This is a safeguard to avoid returning undefined.
        // const shortUrl = longUrl.replace(urlToken, hashToken);

        const shortUrl = await this.checkShortUrlInDatabase(hashToken);

        await this.saveShortenUrl(longUrl, shortUrl, null);

        return shortUrl;
    }

    private async checkShortUrlInDatabase(hashToken: string): Promise<string> {
        let shortUrl = APP_DOMAIN + hashToken;
        let shortenerUrl = await this.getShortenerUrlByShortUrl(shortUrl);

        while (shortenerUrl) {
            logger.info(
                `checkShortUrlInDatabase --> shortUrl: ${shortUrl} is already in the database, re-generating new token`,
            );
            hashToken = uuidv4().slice(0, 7);
            shortUrl = process.env.SHORTENER_DOMAIN + hashToken;
            shortenerUrl = await this.getShortenerUrlByShortUrl(shortUrl);
        }

        return shortUrl;
    }

    private async getShortenerUrlByShortUrl(shortUrl: string): Promise<ShortenerUrl | null> {
        return await shortenerUrlRepository.findOneBy({ shortUrl: shortUrl });
    }

    private async getShortenerUrlByCustomUrl(customUrl: string): Promise<ShortenerUrl | null> {
        return await shortenerUrlRepository.findOneBy({ customUrl: customUrl });
    }

    private async saveShortenUrl(longUrl: string, shortUrl: string | null, customUrl: string | null) {
        //save the shortenerUrl to database.
        logger.info(`saveShortenUrl --> shortUrl: ${shortUrl} , longUrl: ${longUrl}, customUrl: ${customUrl}`);
        const shortenerUrl = new ShortenerUrl();
        shortenerUrl.longUrl = longUrl;
        if (typeof shortUrl === 'string') {
            shortenerUrl.shortUrl = shortUrl;
        }
        if (typeof customUrl === 'string') {
            shortenerUrl.customUrl = customUrl;
        }
        shortenerUrl.createdDate = new Date();
        await shortenerUrlRepository.save(shortenerUrl);
    }

    private async baseResponseData(statusCode: number, data: any, message: string) {
        const responseBody = {} as BaseResponse;
        responseBody.status = statusCode;
        responseBody.data = data;
        responseBody.message = message;
        logger.info(`baseResponseData --> `, { RESPONSE: responseBody });

        const lambdaResponse: LambdaResponse = new LambdaResponse();
        lambdaResponse.statusCode = statusCode;
        lambdaResponse.body = JSON.stringify(responseBody);
        return lambdaResponse;
    }

    private async baseResponse(statusCode: number, message: string) {
        const responseBody = {} as BaseResponse;
        responseBody.status = statusCode;
        responseBody.message = message;
        logger.info(`baseResponse --> `, { RESPONSE: responseBody });

        const lambdaResponse: LambdaResponse = new LambdaResponse();
        lambdaResponse.statusCode = statusCode;
        lambdaResponse.body = JSON.stringify(responseBody);
        return lambdaResponse;
    }
}

export default ShortenerService;

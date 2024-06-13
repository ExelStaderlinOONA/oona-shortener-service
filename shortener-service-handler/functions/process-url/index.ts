import { Handler } from "aws-lambda";
import { createHash } from "crypto";
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError, ExpiredError, NotFoundError } from "/opt/nodejs/src/exceptions/error-exception";
import { ShortenerUrl } from '/opt/nodejs/src/entity/shorterner.entity';
import { ShortenerRequest } from "/opt/nodejs/src/dto/request/shortener-request";
import { ShortenerResponse } from "/opt/nodejs/src/dto/response/shortener-response";
import { LambdaResponse } from "/opt/nodejs/src/dto/response/lambda-response";
import { createLogger } from '/opt/nodejs/loggerUtil';
import { BaseService } from '/opt/nodejs/src/service/base-service';
import * as StringUtils from '/opt/nodejs/src/utils/string-util';
import * as Constants from "/opt/nodejs/src/utils/constant";
import * as DateUtils from '/opt/nodejs/src/utils/date-util';
import ShortenerService from '/opt/nodejs/shortenerService';

const logger = createLogger();

/* this regex will check if first & last character is alphabet or number,
and only allow alphabet, number, and dash character */

const CUSTOM_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/;

const CONFIG = {
    SHORTENER_BASE_DOMAIN: process.env.SHORTENER_BASE_DOMAIN,
};

const shortenerService: ShortenerService = new ShortenerService();

export const handler = async (event: Handler): Promise<Handler> => {
    try {
        await shortenerService.initializeDataSource();
        logger.info('Event: ' + JSON.stringify(event));
        return await proceessTheUrl(event); // endpoint: /api/shorten to generate short url
    } catch (err) {
        return await BaseService.handlingErrorResponse(err);
    }
};

async function proceessTheUrl(event: any): Promise<LambdaResponse> {
    logger.info('Request Event: ', event);

    const apiRequestPayload: ShortenerRequest = new ShortenerRequest();
    await BaseService.assignAnyToObject(apiRequestPayload, event.body);

    if (StringUtils.isEmpty(apiRequestPayload.url)) {
        throw new BadRequestError(Constants.URL_NOT_PROVIDED_MSG);
    }

    const shortenerUrl = await generateTheUrl(apiRequestPayload);

    const apiResponsePayload: ShortenerResponse = new ShortenerResponse();
    if (shortenerUrl != null) {
        apiResponsePayload.shortenUrl = shortenerUrl.shortUrl;
        apiResponsePayload.longUrl = shortenerUrl.longUrl;
        apiResponsePayload.shortUrlId = shortenerUrl.shortUrlId;
        apiResponsePayload.expiredDate = DateUtils.formatDateToString(shortenerUrl.expiredDate);
        return await BaseService.baseResponseData(200, apiResponsePayload, Constants.SUCCESS_GENERATE_URL_MSG);
    } else {
        throw new Error(Constants.ERROR_GENERATE_URL_MSG);
    }
}

async function generateTheUrl(apiRequestPayload: ShortenerRequest): Promise<ShortenerUrl | null> {
    //Check if the shortener url is custom
    if (apiRequestPayload.isCustom) {
        return await createCustomUrl(
            apiRequestPayload.url,
            apiRequestPayload.customId,
            apiRequestPayload.expiredDate,
        );
    } else {
        //Create the short url.
        const hashToken = await hashLongUrl(apiRequestPayload.url);
        return await createShortenUrl(apiRequestPayload.url, hashToken, apiRequestPayload.expiredDate);
    }
}

async function hashLongUrl(url: string) {
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

async function createCustomUrl(
    longUrl: string,
    customId: string,
    expiredDate: string,
): Promise<ShortenerUrl | null> {
    // validate the customId
    validateCustomId(customId);

    //check if the customId is already in the database.
    const shortenerUrl = await shortenerService.findShortenerUrlByShortUrlId(customId);
    if (shortenerUrl) {
        throw new BadRequestError(Constants.CUSTOM_ID_TAKEN_MSG);
    }

    const shortUrl = CONFIG.SHORTENER_BASE_DOMAIN + customId;

    // save the record to database.
    return await shortenerService.saveShortenerUrl(longUrl, shortUrl, customId, expiredDate);
}

function validateCustomId(customId: string): void {
    const allowedLength = 30;
    if (StringUtils.isEmpty(customId)) {
        throw new BadRequestError(Constants.CUSTOM_ID_EMPTY_MSG);
    }
    if (!CUSTOM_ID_REGEX.test(customId)) {
        throw new BadRequestError(Constants.CUSTOM_ID_INVALID_FORMAT_MSG);
    }
    if (customId.length > allowedLength) {
        throw new BadRequestError(`${Constants.CUSTOM_ID_LENGTH_ERROR_MSG}: ${allowedLength}`);
    }
}

async function createShortenUrl(
    longUrl: string,
    hashToken: string,
    expiredDate: string,
): Promise<ShortenerUrl | null> {
    // Extract the token of the URL
    // const urlToken = longUrl.split('/').pop() || ''; //This is a safeguard to avoid returning undefined.
    // const shortUrl = longUrl.replace(urlToken, hashToken);

    let shortUrl = CONFIG.SHORTENER_BASE_DOMAIN + hashToken;
    let shortenerUrl = await shortenerService.findShortenerUrlByShortUrl(shortUrl);

    //check if the shortUrl is already in the database.
    while (shortenerUrl) {
        logger.info(
            `checkShortUrlInDatabase --> shortUrl: ${shortUrl} is already in the database, re-generating new token`,
        );
        hashToken = uuidv4().slice(0, 7);
        shortUrl = CONFIG.SHORTENER_BASE_DOMAIN + hashToken;
        shortenerUrl = await shortenerService.findShortenerUrlByShortUrl(shortUrl);
    }

    // save the record to database.
    return await shortenerService.saveShortenerUrl(longUrl, shortUrl, hashToken, expiredDate);
}
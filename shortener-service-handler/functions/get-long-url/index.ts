import { Handler } from "aws-lambda";
import { BadRequestError, ExpiredError, NotFoundError } from "/opt/nodejs/src/exceptions/error-exception";
import { LambdaResponse } from "/opt/nodejs/src/dto/response/lambda-response";
import { createLogger } from '/opt/nodejs/loggerUtil';
import { formatDateToString } from '/opt/nodejs/src/utils/date-util';
import { BaseService } from '/opt/nodejs/src/service/base-service';
import * as Constants from "/opt/nodejs/src/utils/constant";
import ShortenerService from '/opt/nodejs/shortenerService';

const logger = createLogger();
const shortenerService: ShortenerService = new ShortenerService();

export const handler = async (event: Handler): Promise<Handler> => {
    try {
        await shortenerService.initializeDataSource();

        logger.info('Event: ' + JSON.stringify(event));

        return await getTheLongUrl(event); // endpoint: /{shortUrlId} to get long url

    } catch (err) {
        return await BaseService.handlingErrorResponse(err);
    }
};

async function getTheLongUrl(event: any): Promise<LambdaResponse> {
    const shortUrlId = event.pathParameters?.shortUrlId;
    if (!shortUrlId) {
        throw new BadRequestError(Constants.SHORT_URL_NOT_PROVIDED_MSG);
    }

    //Check if the short url id is exist in database
    const shortenerUrl = await shortenerService.findShortenerUrl(shortUrlId);
    if (!shortenerUrl) {
        throw new NotFoundError(`${Constants.SHORT_URL_NOT_FOUND_MSG}: ${shortUrlId}`);
    }

    //Check if the expiredDate is not null and the date is not expired
    if (shortenerUrl.expiredDate && shortenerUrl.expiredDate < new Date()) {
        logger.error(`Expired Date: ${formatDateToString(shortenerUrl.expiredDate)}`);
        throw new ExpiredError(Constants.SHORT_URL_EXPIRED_MSG);
    }

    return await BaseService.redirectResponse(shortenerUrl.longUrl);
}
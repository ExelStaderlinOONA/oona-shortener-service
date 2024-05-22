import { loggingAspectClass } from '/opt/nodejs/loggingAspect';
import { createLogger } from '/opt/nodejs/loggerUtil';
import { APP_VERSION } from 'src/util/constant';
import { ShortenerRequest } from 'src/dto/request/shortener-request';
import { ShortenerResponse } from 'src/dto/response/shortener-response';
import { BaseResponse } from 'src/dto/response/base-response';
import { LambdaResponse } from 'src/dto/response/lambda-response';
import { createHash } from 'crypto';

const logger = createLogger();

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
            const hashToken = await this.hashUrlToken(apiRequestPayload.url);
            const shortenUrl = await this.createShortenUrl(apiRequestPayload.url, hashToken);

            const apiResponsePayload: ShortenerResponse = new ShortenerResponse();
            apiResponsePayload.shortenUrl = shortenUrl;
            apiResponsePayload.shortenHashToken = hashToken;
            apiResponsePayload.expiredTime = apiRequestPayload.expiredTime;

            apiCallResponse = await this.baseResponseData(200, apiResponsePayload, 'Success operation');
            return apiCallResponse;
        } catch (err) {
            logger.error(`Error: ${err}`);
            return await this.baseResponse(500, 'Internal Server Error');
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

    private async hashUrlToken(url: string) {
        // Extract the token of the URL
        const urlToken = url.split('/').pop();
        if (!urlToken) {
            throw new Error('Invalid URL');
        }

        // Create a SHA-256 hash of the last segment
        const hash = createHash('sha256');
        hash.update(urlToken);
        const hashedValue = hash.digest('hex');

        logger.info(`urlToken: ${urlToken} -> hash: ${hashedValue}`);

        // substring first 7 character
        return hashedValue.substring(0, 7);
    }

    private async createShortenUrl(url: string, hashToken: string) {
        // Extract the token of the URL
        const urlToken = url.split('/').pop() || ''; //This is a safeguard to avoid returning undefined.
        return url.replace(urlToken, hashToken);
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

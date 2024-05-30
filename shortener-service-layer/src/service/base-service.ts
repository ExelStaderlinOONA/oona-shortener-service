import { createLogger } from '/opt/nodejs/loggerUtil';
import { BaseResponse } from 'src/dto/response/base-response';
import { LambdaResponse } from 'src/dto/response/lambda-response';
import { BadRequestError, ExpiredError, NotFoundError } from 'src/exceptions/error-exception';
import * as Constants from 'src/utils/constant';

const logger = createLogger();

export class BaseService {
    async handlingErrorResponse(err: any) {
        if (err instanceof BadRequestError) {
            logger.error(`Error: ${err.message}`, err);
            return await this.baseResponse(400, `${Constants.ERROR_BAD_REQUEST}: ${err.message}`);
        } else if (err instanceof ExpiredError) {
            logger.error(`Error: ${err.message}`, err);
            return await this.baseResponse(410, `${Constants.ERROR_GONE}: ${err.message}`);
        } else if (err instanceof NotFoundError) {
            logger.error(`Error: ${err.message}`, err);
            return await this.baseResponse(404, `${Constants.ERROR_NOT_FOUND}: ${err.message}`);
        } else if (err instanceof Error) {
            logger.error(`Error: ${err.message}`, err);
            return await this.baseResponse(500, `${Constants.ERROR_INTERNAL_SERVER}: ${err.message}`);
        } else {
            const errorMessage = 'An unknown error occurred.';
            return await this.baseResponse(500, `${Constants.ERROR_INTERNAL_SERVER}: ${errorMessage}`);
        }
    }

    async assignAnyToObject(object: any, payload: any) {
        try {
            Object.assign(object, JSON.parse(payload));
        } catch {
            Object.assign(object, JSON.parse(JSON.stringify(payload)));
        }
        logger.info(`objectPayload : ${JSON.stringify(object)}`);
    }

    async baseResponseData(statusCode: number, data: any, message: string) {
        const responseBody = {} as BaseResponse;
        responseBody.status = await this.getStatusCodeName(statusCode);
        responseBody.data = data;
        responseBody.message = message;
        logger.info(`baseResponseData --> `, { RESPONSE: responseBody });

        const lambdaResponse: LambdaResponse = new LambdaResponse();
        lambdaResponse.statusCode = statusCode;
        lambdaResponse.body = JSON.stringify(responseBody);
        return lambdaResponse;
    }

    async baseResponse(statusCode: number, message: string) {
        const responseBody = {} as BaseResponse;
        responseBody.status = await this.getStatusCodeName(statusCode);
        responseBody.message = message;
        logger.info(`baseResponse --> `, { RESPONSE: responseBody });

        const lambdaResponse: LambdaResponse = new LambdaResponse();
        lambdaResponse.statusCode = statusCode;
        lambdaResponse.body = JSON.stringify(responseBody);
        return lambdaResponse;
    }

    async redirectResponse(url: string) {
        // Construct the redirect response
        const lambdaResponse: LambdaResponse = new LambdaResponse();
        lambdaResponse.statusCode = 302;
        lambdaResponse.headers = { Location: url };
        lambdaResponse.body = '';
        return lambdaResponse;
    }

    async getStatusCodeName(statusCode: number): Promise<string> {
        switch (statusCode) {
            case 200:
                return 'success';
            case 400:
                return 'fail';
            case 410:
                return 'fail';
            case 404:
                return 'fail';
            case 500:
                return 'error';
            default:
                return 'unknown';
        }
    }
}

export default BaseService;

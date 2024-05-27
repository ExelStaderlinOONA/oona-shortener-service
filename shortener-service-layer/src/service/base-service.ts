import { createLogger } from '/opt/nodejs/loggerUtil';
import { BaseResponse } from 'src/dto/response/base-response';
import { LambdaResponse } from 'src/dto/response/lambda-response';

const logger = createLogger();

export class BaseService {
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
        responseBody.status = statusCode;
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
        responseBody.status = statusCode;
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
}

export default BaseService;

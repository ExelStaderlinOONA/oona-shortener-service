import { Handler } from "aws-lambda";
import BaseService from '/opt/nodejs/src/service/base-service';
import dotenv from 'dotenv';


dotenv.config();

const CONFIG = {
    APP_VERSION: process.env.APP_VERSION,
};

export const lambdaHandler = async (event: Handler): Promise<Handler> => {
    try {
        return await BaseService.baseResponse(200, `Shortener service version: ${CONFIG.APP_VERSION}`);
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
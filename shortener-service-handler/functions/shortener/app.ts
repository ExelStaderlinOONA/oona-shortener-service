import { Handler } from "aws-lambda";
import ShortenerService from '/opt/nodejs/shortenerService';
import { initializeDataSource } from "/opt/nodejs/src/config/data-source.config";

let shortenerService: ShortenerService = new ShortenerService();

export const shortenProcessHandler = async (event: Handler): Promise<Handler> => {
    try {
        await initializeDataSource();
        const apiCallResponse = await shortenerService.proceessTheUrl(event);
        return apiCallResponse;
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error in the handler.',
            }),
        };
    }
};

export const shortenUrlHandler = async (event: Handler): Promise<Handler> => {
    try {
        await initializeDataSource();
        const apiCallResponse = await shortenerService.getTheLongUrl(event);
        return apiCallResponse;
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error in the handler.',
            }),
        };
    }
};


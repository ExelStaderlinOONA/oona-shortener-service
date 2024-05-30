import { Handler } from "aws-lambda";
import ShortenerService from '/opt/nodejs/shortenerService';
import { initializeDataSource } from "/opt/nodejs/src/config/data-source.config";

let shortenerService: ShortenerService = new ShortenerService();

export const shortenHandler = async (event: Handler): Promise<Handler> => {
    try {
        await initializeDataSource();
        console.log(`shortenHandler, triggering endpoint: ${event.path}`)
        switch(event.path) {
            case '/api/shorten':         
                return await shortenerService.proceessTheUrl(event); // endpoint: /api/shorten to generate short url
            default:
                return await shortenerService.getTheLongUrl(event); // endpoint: /{shortUrlId} to get long url
        }
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


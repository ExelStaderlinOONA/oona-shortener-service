import { createLogger } from '/opt/nodejs/loggerUtil';
import { MyDataSource } from 'src/config/data-source.config';
import { ShortenerUrl } from 'src/entity/shorterner.entity';
import * as DateUtils from 'src/utils/date-util';

const logger = createLogger();

const shortenerUrlRepository = MyDataSource.getRepository(ShortenerUrl);

class ShortenerService {
    async saveShortenerUrl(
        longUrl: string,
        shortUrl: string,
        shortUrlId: string,
        expiredDate: string,
    ): Promise<ShortenerUrl | null> {
        //save the shortenerUrl to database.
        logger.info(`saveShortenUrl --> shortUrl: ${shortUrl} , longUrl: ${longUrl}, shortUrlId: ${shortUrlId}`);
        const shortenerUrl = new ShortenerUrl();
        shortenerUrl.longUrl = longUrl;
        shortenerUrl.shortUrl = shortUrl;
        shortenerUrl.shortUrlId = shortUrlId;
        shortenerUrl.createdDate = new Date();
        //ternary operator to check if the expiredDate is not empty.
        shortenerUrl.expiredDate = expiredDate ? DateUtils.formatStringToDate(expiredDate) : null;
        return await shortenerUrlRepository.save(shortenerUrl);
    }

    async findShortenerUrl(shortUrlId: string): Promise<ShortenerUrl | null> {
        const shortenerUrl = await shortenerUrlRepository.findOneBy({ shortUrlId: shortUrlId });
        return shortenerUrl;
    }

    async findShortenerUrlByShortUrl(shortUrl: string): Promise<ShortenerUrl | null> {
        return await shortenerUrlRepository.findOneBy({ shortUrl: shortUrl });
    }

    async findShortenerUrlByShortUrlId(customId: string): Promise<ShortenerUrl | null> {
        return await shortenerUrlRepository.findOneBy({ shortUrlId: customId });
    }

    async initializeDataSource() {
        try {
            // Check if the DataSource is already initialized
            if (!MyDataSource.isInitialized) {
                await MyDataSource.initialize();
                logger.info('DataSource initialized successfully');
            }
            return MyDataSource;
        } catch (error) {
            logger.error('Error during DataSource initialization:', { Error: error });
        }
    }
}

export default ShortenerService;

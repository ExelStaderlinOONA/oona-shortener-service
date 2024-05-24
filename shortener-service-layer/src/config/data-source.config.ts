import { DataSource } from 'typeorm';
import { ShortenerUrl } from 'src/entity/shorterner.entity';

// dotenv.config();
// console.log('database host : ' + process.env.DATABASE_HOST)

// docker run --name some-postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mydb -p 5432:5432 -d postgres
export const MyDataSource = new DataSource({
    type: 'postgres',
    host: 'host.docker.internal',
    port: 5432,
    username: 'admin',
    password: 'password',
    database: 'mydb',

    // type: 'postgres',
    // host: process.env.DATABASE_HOST,
    // port: parseInt(process.env.DATABASE_PORT, 10),
    // username: process.env.DATABASE_USERNAME,
    // password: process.env.DATABASE_PASSWORD,
    // database: process.env.DATABASE_SCHEMA,

    synchronize: true,
    logging: false,
    entities: [ShortenerUrl],
    // entities: ['src/entity/*.entity.js'],
    migrations: [],
    subscribers: [],
    // migrations: ['../migration/*.ts'],
});

// export const DatabasePro = initializeDataSource();

export async function initializeDataSource() {
    try {
        // Check if the DataSource is already initialized
        if (!MyDataSource.isInitialized) {
            await MyDataSource.initialize();
            console.log('DataSource initialized successfully');
        }
        return MyDataSource;
    } catch (error) {
        console.error('Error during DataSource initialization:', error);
    }
}
/* 
MyDataSource.initialize()
    .then(() => {
        // console.log(process.env.DATABASE_HOST);
        // console.log(process.env.DATABASE_PORT);
        // console.log(process.env.DATABASE_USERNAME);
        // console.log(process.env.DATABASE_PASSWORD);
        // console.log(process.env.DATABASE_SCHEMA);
        console.log('Exel Data Source has been initialized!');
    })
    .catch((err) => {
        console.error('Error during Data Source initialization:', err);
        // console.log(process.env.DATABASE_HOST);
        // console.log(process.env.DATABASE_PORT);
        // console.log(process.env.DATABASE_USERNAME);
        // console.log(process.env.DATABASE_PASSWORD);
        // console.log(process.env.DATABASE_SCHEMA);
    }); */

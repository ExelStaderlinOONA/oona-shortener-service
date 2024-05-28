CREATE TABLE int_shortener_url (
    id SERIAL PRIMARY KEY,
    short_url VARCHAR(255) NOT NULL UNIQUE,
    long_url TEXT NOT NULL,
    short_url_id VARCHAR(255) NOT NULL UNIQUE,
    created_date TIMESTAMP NOT NULL,
    expired_date TIMESTAMP
);

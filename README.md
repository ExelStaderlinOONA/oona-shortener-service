# Oona Shortener Service

The Oona Shortener Service is a serverless application built on AWS Lambda that provides a URL shortening service. This service allows users to create short, unique URLs that redirect to longer, original URLs.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features
- Create short URLs from long URLs
- Redirect users from short URLs to the original long URLs
- Retrieve application version information

## Installation
To deploy the Oona Shortener Service, you'll need to have the following prerequisites:

1. An AWS account with the necessary permissions to create and manage AWS Lambda functions, API Gateway, and other related services.
2. The AWS CLI installed and configured on your local machine.
3. Node.js and npm installed on your local machine.
4. Docker installed on your local machine.

Once you have the prerequisites, follow these steps:

1. Clone the repository: `git clone https://github.com/ExelStaderlinOONA/oona-shortener-service.git`
2. Navigate to the project directory: `cd oona-shortener-service`
3. Go to shortener-service-layer - RUN: `npm install -g esbuild` or `npm install`
3. Go to shortener-service-layer - RUN: `npm run build`
4. Go to shortener-service-handler - Build the sam project: `sam build --build-in-source`
5. Go to shortener-service-handler - Deploy the application to Local: `sam local start-api`

## Installation Docker
1. Install Docker `https://hub.docker.com/`
2. Pull Postgres Image `docker pull postgres`
3. Run `docker run --name some-postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mydb -p 5432:5432 -d postgres`

## Create the database
1. Download DBeaver `https://dbeaver.io/download/`
2. Run the script inside database folder `create-shortener-db.sql` to create the table.


## Usage
After deploying the application, you can use the following API endpoints to interact with the Oona Shortener Service.

## API Endpoints
- `POST /shorten`: Create a short URL from a long URL.
- `GET /{shortUrl}`: Redirect from the short URL to the original long URL.
- `GET /app-version`: Retrieve the current version of the application.

For detailed information on how to use these endpoints, please refer to the project's API documentation.

## Contributing
We welcome contributions to the Oona Shortener Service project. If you'd like to contribute, please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them
4. Push your changes to your forked repository
5. Submit a pull request to the main repository

Before submitting a pull request, please make sure your code follows the project's coding standards and that all tests pass.

## License
This project is licensed under the [MIT License](LICENSE).

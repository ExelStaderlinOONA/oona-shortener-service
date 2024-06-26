export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
    }
}

export class ExpiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExpiredError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

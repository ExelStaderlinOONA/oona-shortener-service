export class ShortenerResponse {
    shortenUrl: string;
    longUrl: string;
    shortUrlId: string;
    createdDate: string;
    expiredDate: string | null;
}

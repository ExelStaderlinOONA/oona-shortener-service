import { Entity, PrimaryGeneratedColumn, Column, Timestamp } from 'typeorm';

@Entity({ name: 'int_shortener_url' })
export class ShortenerUrl {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'short_url', nullable: false, type: 'varchar' })
    shortUrl: string;

    @Column({ name: 'long_url', nullable: false, type: 'text' })
    longUrl: string;

    @Column({ name: 'short_url_id', nullable: false, type: 'varchar' })
    shortUrlId: string;

    @Column({ name: 'created_date', nullable: false, type: 'timestamp' })
    createdDate: Date;

    @Column({ name: 'expired_date', default: null, type: 'timestamp' })
    expiredDate: Date | null;

}

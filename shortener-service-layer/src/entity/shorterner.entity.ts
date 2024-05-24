import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'int_shortener_url' })
export class ShortenerUrl {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: null, type: 'varchar' })
    shortUrl: string;

    @Column({ default: null, type: 'varchar' })
    longUrl: string;

    @Column({ default: null, type: 'varchar' })
    customUrl: string;

    @Column({ default: null, type: 'date' })
    createdDate: Date;

    @Column({ default: null, type: 'date' })
    expiredDate: Date;

}

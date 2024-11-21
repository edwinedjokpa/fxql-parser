import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('increment')
  entryId: number;

  @Column()
  sourceCurrency: string;

  @Column()
  destinationCurrency: string;

  @Column({ unique: true })
  currencyPair: string;

  @Column('decimal', { precision: 15, scale: 6 })
  buyPrice: number;

  @Column('decimal', { precision: 15, scale: 6 })
  sellPrice: number;

  @Column('integer')
  capAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

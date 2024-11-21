import { Test, TestingModule } from '@nestjs/testing';
import { FxqlController } from './fxql.controller';
import { FxqlService } from './fxql.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRate } from '../database/entities/exchange-rates.entity';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';

describe('FxqlController (integration)', () => {
  let app;

  const mockExchangeRateRepository = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxqlController],
      providers: [
        FxqlService,
        {
          provide: getRepositoryToken(ExchangeRate),
          useValue: mockExchangeRateRepository,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should successfully parse and store FXQL rates', async () => {
    const fxqlData = {
      FXQL: `USD-GBP {
        BUY 0.85
        SELL 0.90
        CAP 10000
      }`,
    };

    mockExchangeRateRepository.save.mockResolvedValueOnce({
      sourceCurrency: 'USD',
      destinationCurrency: 'GBP',
      buyPrice: 0.85,
      sellPrice: 0.9,
      capAmount: 10000,
    });

    const response = await request(app.getHttpServer())
      .post('/fxql-statements')
      .send(fxqlData)
      .expect(HttpStatus.CREATED);

    expect(response.body.message).toBe('Rates Parsed Successfully.');
    expect(response.body.data.exchangeRates).toHaveLength(1);
    expect(response.body.data.exchangeRates[0].sourceCurrency).toBe('USD');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});

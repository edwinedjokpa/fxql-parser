import { Test, TestingModule } from '@nestjs/testing';
import { FxqlService } from './fxql.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRate } from './../database/entities/exchange-rates.entity';
import { HttpErrorException } from '../utils/error.util';
import { CreateFxqlDto } from './dto/fxql.dto';

describe('FxqlService', () => {
  let service: FxqlService;
  let repository: Repository<ExchangeRate>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxqlService,
        {
          provide: getRepositoryToken(ExchangeRate),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<FxqlService>(FxqlService);
    repository = module.get<Repository<ExchangeRate>>(
      getRepositoryToken(ExchangeRate),
    );
  });

  describe('storeExchangeRate', () => {
    beforeEach(() => {
      repository = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      } as unknown as Repository<ExchangeRate>;

      service = new FxqlService(repository);
    });

    it('should store new exchange rates successfully', async () => {
      const createFxqlDto: CreateFxqlDto = {
        FXQL: `USD-GBP {
          BUY 0.85
          SELL 0.90
          CAP 10000
        }`,
      };

      jest.spyOn(service, 'parseFxql').mockResolvedValueOnce([
        {
          sourceCurrency: 'USD',
          destinationCurrency: 'GBP',
          buyPrice: 0.85,
          sellPrice: 0.9,
          capAmount: 10000,
        },
      ]);

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      const mockExchangeRate = new ExchangeRate();
      mockExchangeRate.entryId = 1;
      mockExchangeRate.sourceCurrency = 'USD';
      mockExchangeRate.destinationCurrency = 'GBP';
      mockExchangeRate.buyPrice = 0.85;
      mockExchangeRate.sellPrice = 0.9;
      mockExchangeRate.capAmount = 10000;
      mockExchangeRate.currencyPair = 'USD-GBP';

      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockExchangeRate);

      const result = await service.storeExchangeRate(createFxqlDto);

      expect(result.total).toBe(1);
      expect(result.exchangeRates[0].sourceCurrency).toBe('USD');
      expect(result.exchangeRates[0].destinationCurrency).toBe('GBP');
      expect(result.exchangeRates[0].buyPrice).toBe(0.85);
      expect(result.exchangeRates[0].sellPrice).toBe(0.9);
      expect(result.exchangeRates[0].capAmount).toBe(10000);
    });

    it('should throw an error if more than the max number of pairs are provided', async () => {
      const createFxqlDto: CreateFxqlDto = {
        FXQL: `USD-GBP {
          BUY 0.85
          SELL 0.90
          CAP 10000
        }
        USD-GBP {
          BUY 1.20
          SELL 1.25
          CAP 5000
        }`,
      };

      jest
        .spyOn(service, 'parseFxql')
        .mockResolvedValueOnce(new Array(1001).fill({}));

      await expect(service.storeExchangeRate(createFxqlDto)).rejects.toThrow(
        HttpErrorException,
      );
    });

    it('should update existing exchange rate if the pair already exists', async () => {
      const createFxqlDto: CreateFxqlDto = {
        FXQL: `USD-GBP {
          BUY 0.85
          SELL 0.90
          CAP 10000
        }`,
      };

      jest.spyOn(service, 'parseFxql').mockResolvedValueOnce([
        {
          sourceCurrency: 'USD',
          destinationCurrency: 'GBP',
          buyPrice: 0.85,
          sellPrice: 0.9,
          capAmount: 10000,
        },
      ]);

      const existingExchangeRate = new ExchangeRate();
      existingExchangeRate.sourceCurrency = 'USD';
      existingExchangeRate.destinationCurrency = 'GBP';
      existingExchangeRate.buyPrice = 1.0;
      existingExchangeRate.sellPrice = 1.05;
      existingExchangeRate.capAmount = 5000;
      existingExchangeRate.currencyPair = 'USD-GBP';

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(existingExchangeRate);

      jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(existingExchangeRate);

      const result = await service.storeExchangeRate(createFxqlDto);

      expect(result.total).toBe(1);
      expect(result.exchangeRates[0].buyPrice).toBe(0.85);
      expect(result.exchangeRates[0].sellPrice).toBe(0.9);
    });

    it('should throw an error if an error occurs during processing FXQL pair', async () => {
      const createFxqlDto: CreateFxqlDto = {
        FXQL: `USD-GBP {
          BUY 0.85
          SELL 0.90
          CAP 10000
        }`,
      };

      jest.spyOn(service, 'parseFxql').mockResolvedValueOnce([
        {
          sourceCurrency: 'USD',
          destinationCurrency: 'GBP',
          buyPrice: 0.85,
          sellPrice: 0.9,
          capAmount: 10000,
        },
      ]);

      jest
        .spyOn(repository, 'save')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(service.storeExchangeRate(createFxqlDto)).rejects.toThrow(
        HttpErrorException,
      );
    });
  });

  describe('parseFxql', () => {
    it('should correctly parse a valid FXQL statement', async () => {
      const createFxqlDto: CreateFxqlDto = {
        FXQL: `USD-GBP {
          BUY 0.85
          SELL 0.90
          CAP 10000
        }`,
      };

      const result = await service.parseFxql(createFxqlDto);

      expect(result).toHaveLength(1);
      expect(result[0].sourceCurrency).toBe('USD');
      expect(result[0].destinationCurrency).toBe('GBP');
      expect(result[0].buyPrice).toBe(0.85);
      expect(result[0].sellPrice).toBe(0.9);
      expect(result[0].capAmount).toBe(10000);
    });

    it('should throw an error if the FXQL statement is invalid', async () => {
      const createFxqlDto: CreateFxqlDto = {
        FXQL: `usd-GBP {
          BUY 0.85
          SELL 0.90
          CAP -10000
        }`,
      };

      await expect(service.parseFxql(createFxqlDto)).rejects.toThrow(
        HttpErrorException,
      );
    });
  });

  describe('generateMaxPairs', () => {
    it('should generate at least 1001 pairs', async () => {
      const result = await service.generateMaxPairs();
      const generatedPairs = JSON.parse(result)
        .FXQL.trim()
        .split('\n\n').length;
      expect(generatedPairs).toBeGreaterThanOrEqual(1001);
    });
  });
});

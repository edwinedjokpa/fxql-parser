import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { ExchangeRate } from '../database/entities/exchange-rates.entity';
import { Repository } from 'typeorm';
import { CreateFxqlDto, FxqlDto } from './dto/fxql.dto';
import { validate } from 'class-validator';
import { HttpErrorException } from '../utils/error.util';
import { FXQL_REGEX } from './fxql.regex';

@Injectable()
export class FxqlService {
  private readonly logger = new Logger(FxqlService.name);
  private readonly MAX_CURRENCY_PAIRS = 1000;

  constructor(
    @InjectRepository(ExchangeRate)
    private fxqlRepository: Repository<ExchangeRate>,
  ) {}

  // Store FXQL data in the database
  async storeExchangeRate(createFxqlDto: CreateFxqlDto) {
    const parsedData = await this.parseFxql(createFxqlDto);

    if (parsedData.length > this.MAX_CURRENCY_PAIRS) {
      throw new HttpErrorException(
        `Maximum number of currency pairs exceeded. Allowed: ${this.MAX_CURRENCY_PAIRS}, but got: ${parsedData.length}`,
        'FXQL-400',
        HttpStatus.BAD_REQUEST,
      );
    }

    const latestPairsMap = new Map<string, FxqlDto>();

    parsedData.forEach((fxqlDto) => {
      const pair = `${fxqlDto.sourceCurrency}-${fxqlDto.destinationCurrency}`;
      latestPairsMap.set(pair, fxqlDto);
    });

    const uniqueParsedData = Array.from(latestPairsMap.values());
    const savedEntries = [];

    const updatePromises = uniqueParsedData.map(async (fxqlDto) => {
      try {
        const currencyPair = `${fxqlDto.sourceCurrency}-${fxqlDto.destinationCurrency}`;

        const existingRecord = await this.fxqlRepository.findOne({
          where: { currencyPair },
        });

        if (existingRecord) {
          existingRecord.buyPrice = fxqlDto.buyPrice;
          existingRecord.sellPrice = fxqlDto.sellPrice;
          existingRecord.capAmount = fxqlDto.capAmount;
          existingRecord.currencyPair = currencyPair;

          const updateRecord = await this.fxqlRepository.save(existingRecord);
          savedEntries.push(updateRecord);
        } else {
          const newFxqlDto = this.fxqlRepository.create({
            ...fxqlDto,
            currencyPair,
          });

          const newRecord = await this.fxqlRepository.save(newFxqlDto);
          savedEntries.push(newRecord);
        }
      } catch (error) {
        throw new HttpErrorException(
          `Error processing FXQL pair ${fxqlDto.sourceCurrency}-${fxqlDto.destinationCurrency}: ${error.message}`,
          'FXQL-500',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    await Promise.all(updatePromises);

    return savedEntries;
  }

  // Parse and validate the FXQL statement
  async parseFxql(createFxqlDto: CreateFxqlDto): Promise<FxqlDto[]> {
    const { FXQL } = createFxqlDto;
    const normalizedFXQL = FXQL.replace(/\\n/g, '\n').trim();
    const regex = FXQL_REGEX;

    const fxqlStatements = normalizedFXQL
      .split(/(?<=\})\s*/g)
      .map((statement) => statement.trim());

    const parsedEntries: FxqlDto[] = [];

    for (let index = 0; index < fxqlStatements.length; index++) {
      const fxqlStatement = fxqlStatements[index];

      this.logger.log(`FXQL Statement ${index + 1}: ${fxqlStatement}`);

      let match: RegExpExecArray | null;
      while ((match = regex.exec(fxqlStatement)) !== null) {
        this.logger.log(`Match ${index + 1}: ${match[0]}`);

        const [
          ,
          sourceCurrency,
          destinationCurrency,
          buyPrice,
          sellPrice,
          capAmount,
        ] = match;

        const fxqlDto = plainToClass(FxqlDto, {
          sourceCurrency,
          destinationCurrency,
          buyPrice: parseFloat(buyPrice),
          sellPrice: parseFloat(sellPrice),
          capAmount: parseInt(capAmount, 10),
        });

        try {
          await this.validateFxqlDto(fxqlDto);
          parsedEntries.push(fxqlDto);

          if (parsedEntries.length >= this.MAX_CURRENCY_PAIRS) {
            this.logger.warn(
              `Maximum currency pairs reached. Stopping at ${this.MAX_CURRENCY_PAIRS} pairs.`,
            );
            break;
          }
        } catch (validationError) {
          this.logger.error(
            `Failed to validate match ${index + 1}: ${JSON.stringify(fxqlDto)}. Error: ${validationError.message}`,
          );
        }
      }

      if (!match) {
        this.logger.warn(
          `Failed match at statement ${index + 1}: ${fxqlStatement}`,
        );
      }
    }

    if (parsedEntries.length === 0) {
      throw new HttpErrorException(
        'Invalid FXQL statement.',
        'FXQL-400',
        HttpStatus.BAD_REQUEST,
      );
    }

    return parsedEntries;
  }

  private async validateFxqlDto(fxqlDto: FxqlDto) {
    const errors = await validate(fxqlDto);
    if (errors.length > 0) {
      throw new HttpException(
        `Validation failed: ${errors
          .map((e) => Object.values(e.constraints).join(', '))
          .join('; ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async generateMaxPairs() {
    const currencies = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'NGN',
      'AUD',
      'CAD',
      'CHF',
      'CNY',
      'INR',
    ];

    const minPairs = 1001; // Ensure a minimum of 1001 pairs
    let fxqlString = '';
    let generatedPairs = 0;

    // Helper function to generate a random value within a range
    const generateRandomValue = (min: number, max: number): string => {
      return (Math.random() * (max - min) + min).toFixed(4);
    };

    // Helper function to generate a random cap amount, ensuring it's at least 1001
    const generateRandomCap = (): number => {
      return Math.floor(Math.random() * (1000000 - 1001) + 1001);
    };

    // Ensure that we generate at least 'minPairs' valid FXQL pairs
    while (generatedPairs < minPairs) {
      const sourceCurrency =
        currencies[Math.floor(Math.random() * currencies.length)];
      const destinationCurrency =
        currencies[Math.floor(Math.random() * currencies.length)];

      // Avoid pairing a currency with itself
      if (sourceCurrency === destinationCurrency) {
        continue;
      }

      const buyPrice = generateRandomValue(0.1, 2.0);
      const sellPrice = generateRandomValue(0.1, 2.0);
      const capAmount = generateRandomCap();

      // Format the FXQL string for this pair
      fxqlString += `${sourceCurrency}-${destinationCurrency} {\n  BUY ${buyPrice}\n  SELL ${sellPrice}\n  CAP ${capAmount}\n}\n\n`;

      // Increment the counter for the generated pairs
      generatedPairs++;
    }

    return JSON.stringify({ FXQL: fxqlString });
  }
}

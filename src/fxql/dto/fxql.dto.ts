import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Matches,
  IsPositive,
  IsInt,
  Min,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class CreateFxqlDto {
  @ApiProperty({
    description: 'A multi-line FXQL string representing foreign exchange data.',
    example: `USD-GBP {\n  BUY 0.85\n  SELL 0.90\n  CAP 10000\n}\n\nEUR-JPY {\n  BUY 145.20\n  SELL 146.50\n  CAP 50000\n}\n\nNGN-USD {\n  BUY 0.0022\n  SELL 0.0023\n  CAP 2000000\n}`,
    type: String,
  })
  @IsNotEmpty({ message: 'FXQL field is required.' })
  @IsString({ message: 'FXQL must be a string.' })
  FXQL: string;
}

export class FxqlDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'Source currency (CURR1) must be exactly 3 uppercase letters.',
  })
  sourceCurrency: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message:
      'Destination currency (CURR2) must be exactly 3 uppercase letters.',
  })
  destinationCurrency: string;

  @IsPositive({ message: 'Buy price must be a positive number' })
  @IsNumber({}, { message: 'Buy price must be a valid number' })
  buyPrice: number;

  @IsPositive({ message: 'Sell price must be a positive number' })
  @IsNumber({}, { message: 'Sell price must be a valid number' })
  sellPrice: number;

  @IsInt()
  @Min(0, { message: 'CAP amount must be a non-negative integer.' })
  capAmount: number;
}

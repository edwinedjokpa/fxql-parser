import { Body, Controller, Get, Post } from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { CreateFxqlDto } from './dto/fxql.dto';
import { createResponse } from '../utils/response.util';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('fxql-statements')
@Controller('fxql-statements')
export class FxqlController {
  constructor(private readonly fxqlService: FxqlService) {}

  @Post()
  @ApiOperation({
    summary: 'Parse FXQL statement and store valid FX rate entry',
    description:
      'This action creates a new foreign exchange rate entry by specifying the source currency, destination currency, buy price, sell price, and cap amount.',
  })
  @ApiBody({ type: CreateFxqlDto })
  @ApiResponse({ status: 200, description: 'Rates parsed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async parseFxql(@Body() createFxqlDto: CreateFxqlDto) {
    const savedRates = await this.fxqlService.storeExchangeRate(createFxqlDto);
    return createResponse('Rates Parsed Successfully.', 'FXQL-201', savedRates);
  }

  @Get('generate-max')
  @ApiOperation({ summary: 'Generate maximum FXQL pairs' })
  @ApiResponse({ status: 200, description: 'List of FXQL pairs' })
  async getMaxPairs() {
    return await this.fxqlService.generateMaxPairs();
  }
}

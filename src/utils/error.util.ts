import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  success: boolean;
  message: string;
  code: string;
}

export class HttpErrorException extends HttpException {
  constructor(
    message: string,
    code: string,
    error: any,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    const response: ErrorResponse = {
      success: false,
      message,
      code,
    };
    super(response, statusCode);
  }
}

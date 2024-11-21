import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ErrorResponse } from './error.util';

@Catch()
export class HttpErrorExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Unknown Error Occured';
    let code = 'FXQL-500';

    // If the exception is an instance of HttpException, we can extract a more detailed error response
    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse();
      if (typeof responseObj === 'object' && responseObj) {
        message = responseObj['message'] || message;
        code = responseObj['code'] || code;
      } else {
        message = responseObj as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Construct the standardized error response
    const errorResponse: ErrorResponse = {
      success: false,
      message,
      code,
    };

    // Send the error response
    response.status(status).json(errorResponse);
  }
}

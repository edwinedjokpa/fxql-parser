import { IsBoolean, IsString, IsObject } from 'class-validator';

export class GenericResponseDto<T> {
  @IsBoolean()
  success: boolean;

  @IsString()
  code: string;

  @IsString()
  message: string;

  @IsObject()
  data: T;
}

export function createResponse<T>(
  message: string,
  code: string,
  data?: T,
): GenericResponseDto<T> {
  return {
    success: true,
    message,
    code,
    data,
  };
}

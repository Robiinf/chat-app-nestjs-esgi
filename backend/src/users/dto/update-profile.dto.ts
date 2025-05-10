import { IsHexColor, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsHexColor()
  messageColor?: string;
}
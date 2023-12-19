import { IsNotEmpty, IsString, IsNumber } from "class-validator";
import { Certificate } from "thor-devkit";
import { ApiProperty } from "@nestjs/swagger";

export class CertificateDto implements Certificate {
  @ApiProperty({ description: "The purpose of the certificate" })
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiProperty({ description: "The payload of the certificate" })
  @IsNotEmpty()
  payload: any;

  @ApiProperty({ description: "The domain of the certificate" })
  @IsNotEmpty()
  @IsString()
  domain: string;

  @ApiProperty({ description: "The timestamp of the certificate" })
  @IsNotEmpty()
  @IsNumber()
  timestamp: number;

  @ApiProperty({ description: "The signer of the certificate" })
  @IsNotEmpty()
  @IsString()
  signer: string;

  @ApiProperty({ description: "The signature of the certificate", required: false })
  @IsNotEmpty()
  @IsString()
  signature?: string;
}

export interface JwtPayload {
  sub: string;
  roles: string[];
}

export interface JwtResponse {
  access_token: string;
}

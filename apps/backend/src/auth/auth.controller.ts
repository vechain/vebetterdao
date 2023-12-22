import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Request, UseGuards } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { CertificateDto } from "./auth.model"
import { AuthGuard } from "./auth.guard"
import { error } from "console"
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "Sign in" })
  @ApiBody({ type: CertificateDto })
  @ApiResponse({ status: 200, description: "Successful login" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async signIn(@Body() cert: CertificateDto) {
    try {
      return await this.authService.signIn(cert)
    } catch (e) {
      error(e)
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
  }

  @UseGuards(AuthGuard)
  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get profile" })
  @ApiResponse({ status: 200, description: "Successful retrieval of profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProfile(@Request() req) {
    return req.user
  }
}

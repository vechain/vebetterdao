import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}

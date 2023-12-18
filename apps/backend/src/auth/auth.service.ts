import { Injectable } from "@nestjs/common";
import { Certificate } from "thor-devkit";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload, JwtResponse } from "./auth.model";
import { certMaxAge } from "./constants";
import ms, { StringValue } from "ms";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  async signIn(cert: Certificate): Promise<JwtResponse> {
    // Throw an error if the certificate is not valid
    Certificate.verify(cert);

    // Check the timestamp is not too old
    const now = Date.now();
    if (now - cert.timestamp > ms(certMaxAge as StringValue)) {
      throw new Error(`Certificate is more than ${certMaxAge} old`);
    }

    const roles = await this.determineUserRoles(cert);

    const payload: JwtPayload = { sub: cert.signer, roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async determineUserRoles(cert: Certificate): Promise<string[]> {
    // TODO: Implement this method
    return [];
  }
}

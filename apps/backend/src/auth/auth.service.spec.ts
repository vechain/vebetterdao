import "../../test/jest.setup";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { buildCertificate } from "../../test/helpers";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
      imports: [
        JwtModule.register({
          secret: "test", // replace with your secret
          signOptions: { expiresIn: "60s" }, // and other options
        }),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    return expect(service).toBeDefined();
  });

  it("should throw an error on empty certificate", () => {
    return expect(service.signIn({} as any)).rejects.toThrow();
  });

  it("should throw an error on invalid certificate", () => {
    return expect(
      service.signIn({
        purpose: "purpose",
        payload: { type: "string", content: "string" },
        domain: "http://localhost:3000/",
        timestamp: 20000,
        signer: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
        signature: "invalid sig",
      }),
    ).rejects.toThrow();
  });

  it("should return a token when certificate is valid", () => {
    const cert = buildCertificate();

    return expect(service.signIn(cert)).resolves.toEqual({
      access_token: expect.any(String),
    });
  });

  it("should throw an error when certificate is too old", () => {
    const cert = buildCertificate();
    cert.timestamp = Date.now() - 100000;

    return expect(service.signIn(cert)).rejects.toThrow();
  });
});

import "../../test/jest.setup"
import { Test, TestingModule } from "@nestjs/testing"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { JwtService } from "@nestjs/jwt"

describe("AuthController", () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn().mockReturnValue("mockedValue"),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mockedToken"),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  it("should call signIn service", () => {
    controller.signIn({} as any)
    expect((controller as any).authService.signIn).toHaveBeenCalled()
  })
})

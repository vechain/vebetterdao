import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { AppModule } from "../src/app.module"
import { buildCertificate } from "./helpers"

describe("AuthController (e2e)", () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it("/auth/login (POST)", () => {
    const cert = buildCertificate()

    return request(app.getHttpServer())
      .post("/auth/login")
      .send(cert)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty("access_token")
      })
  })

  it("/auth/login (POST) - invalid signature", () => {
    const cert = buildCertificate()
    cert.signature = cert.signature.replace("0x", "")

    return request(app.getHttpServer())
      .post("/auth/login")
      .send(cert)
      .expect(401)
      .expect(res => {
        expect(res.body).toHaveProperty("statusCode")
        expect(res.body.statusCode).toBe(401)
        expect(res.body).toHaveProperty("message")
        expect(res.body.message).toBe("Unauthorized")
      })
  })

  it("/auth/login (POST) - invalid certificate", () => {
    const cert = buildCertificate()
    cert.payload = {
      type: "text",
      content: "content altered",
    }

    return request(app.getHttpServer())
      .post("/auth/login")
      .send(cert)
      .expect(401)
      .expect(res => {
        expect(res.body).toHaveProperty("statusCode")
        expect(res.body.statusCode).toBe(401)
        expect(res.body).toHaveProperty("message")
        expect(res.body.message).toBe("Unauthorized")
      })
  })

  it("Call to protected endpoint with a valid cert", async () => {
    const cert = buildCertificate()

    const loginResponse = await request(app.getHttpServer()).post("/auth/login").send(cert).expect(200)

    const token = loginResponse.body.access_token

    return request(app.getHttpServer())
      .get("/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty("sub")
        expect(res.body.sub).toBe(cert.signer)
      })
  })

  it("Call to protected endpoint with an invalid cert", async () => {
    const cert = buildCertificate()

    const loginResponse = await request(app.getHttpServer()).post("/auth/login").send(cert).expect(200)

    const token = loginResponse.body.access_token

    return request(app.getHttpServer())
      .get("/auth/profile")
      .set("Authorization", `Bearer ${token}1`)
      .expect(401)
      .expect(res => {
        expect(res.body).toHaveProperty("statusCode")
        expect(res.body.statusCode).toBe(401)
        expect(res.body).toHaveProperty("message")
        expect(res.body.message).toBe("Unauthorized")
      })
  })

  it("Call to protected endpoint with an expired cert", async () => {
    const cert = buildCertificate()

    const loginResponse = await request(app.getHttpServer()).post("/auth/login").send(cert).expect(200)

    const token = loginResponse.body.access_token

    // Wait for the token to expire
    await new Promise(resolve => setTimeout(resolve, 5200))

    return request(app.getHttpServer())
      .get("/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(401)
      .expect(res => {
        expect(res.body).toHaveProperty("statusCode")
        expect(res.body.statusCode).toBe(401)
        expect(res.body).toHaveProperty("message")
        expect(res.body.message).toBe("Unauthorized")
      })
  }, 15000)

  afterEach(async () => {
    await app.close()
  })
})

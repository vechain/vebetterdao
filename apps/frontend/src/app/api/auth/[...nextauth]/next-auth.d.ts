// next-auth.d.ts
import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      githubUsername: string | null
      twitterUsername: string | null
      discordUsername: string | null
      linkedinUsername: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    githubUsername: string | null
    twitterUsername: string | null
    discordUsername: string | null
    linkedinUsername: string | null
  }
}

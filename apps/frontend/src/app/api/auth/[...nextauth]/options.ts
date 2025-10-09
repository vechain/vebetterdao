import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
// import DiscordProvider from "next-auth/providers/discord"
import TwitterProvider from "next-auth/providers/twitter"
const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET
const twitterClientId = process.env.TWITTER_CLIENT_ID
const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET
// const discordClientId = process.env.DISCORD_CLIENT_ID
// const discordClientSecret = process.env.DISCORD_CLIENT_SECRET
const nextAuthSecret = process.env.NEXTAUTH_SECRET

if (!githubClientId || !githubClientSecret || !nextAuthSecret || !twitterClientId || !twitterClientSecret) {
  console.warn("NEXT-AUTH: Missing environment variables for OAuth")
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  pages: {
    error: "/error",
    signIn: "/error",
  },
  providers: [
    GithubProvider({
      clientId: githubClientId ?? "",
      clientSecret: githubClientSecret ?? "",
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          login: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        }
      },
    }),
    TwitterProvider({
      clientId: twitterClientId ?? "",
      clientSecret: twitterClientSecret ?? "",
      version: "2.0",
      userinfo: "https://api.twitter.com/2/users/me?user.fields=id,username,profile_image_url",
      profile(profile) {
        return {
          id: profile.data.id,
          username: profile.data.username,
          name: profile.data.username,
          email: profile.data.email ?? null,
          image: profile.data.profile_image_url,
        }
      },
    }),
    // DiscordProvider({
    //   clientId: discordClientId ?? "",
    //   clientSecret: discordClientSecret ?? "",
    // }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (token?.githubUsername) {
        session.user.githubUsername = token.githubUsername
      }
      if (token?.twitterUsername) {
        session.user.twitterUsername = token.twitterUsername
      }
      // if (token?.discordUsername) {
      //   session.user.discordUsername = token.discordUsername
      // }
      // if (token?.discordUserId) {
      //   session.user.discordUserId = token.discordUserId
      // }
      return session
    },
    async jwt({ token, account, profile }: any) {
      // Assign GitHub username if provider is GitHub
      if (account?.provider === "github") {
        if (profile?.login) {
          token.githubUsername = profile.login // Capture GitHub username
        }
      }

      // Assign Twitter username if provider is Twitter
      if (account?.provider === "twitter") {
        if (token?.name) {
          token.twitterUsername = token.name // Capture Twitter username
        }
        if (profile?.username) {
          token.twitterUsername = profile.username // Capture Twitter username
        }
      }

      // // Assign Discord username if provider is Discord
      // if (account?.provider === "discord") {
      //   if (profile?.username) {
      //     token.discordUsername = profile.username // Capture Discord username
      //   }
      //   if (profile?.id) {
      //     token.discordUserId = profile.id // Capture Discord user id
      //   }
      // }

      return token
    },
  },
}

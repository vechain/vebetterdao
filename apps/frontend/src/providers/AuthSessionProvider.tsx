import dynamic from "next/dynamic"
import { SessionProviderProps } from "next-auth/react"

const SessionProvider = dynamic(
  async () => {
    const { SessionProvider } = await import("next-auth/react")
    return SessionProvider
  },
  {
    ssr: false,
  },
)
export const AuthSessionProvider = ({ children, session }: SessionProviderProps) => {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

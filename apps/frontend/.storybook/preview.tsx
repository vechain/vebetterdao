import { useEffect } from "react"
import type { Preview } from "@storybook/nextjs-vite"
import { withThemeByClassName } from "@storybook/addon-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider } from "../src/components/ui/provider"
import { TransactionModalProvider } from "../src/providers/TransactionModalProvider.tsx"
import { VStack, Flex, Container } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { setMockAddress } from "./mockAddressState"

import { initialize, mswLoader } from "msw-storybook-addon"

import { languages } from "../src/i18n"
import "../src/i18n"
import { handlers } from "./mocks/handlers.ts"

initialize()

export const globalTypes = {
  locale: {
    name: "Locale",
    description: "Internationalization locale",
    toolbar: {
      icon: "globe",
      items: languages.map(language => ({
        value: language.code,
        title: language.name,
      })),

      showName: true,
    },
  },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
    },
  },
})

const preview: Preview = {
  parameters: {
    viewport: { defaultViewport: "mobile2" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    msw: { handlers },
  },
  initialGlobals: { theme: "light", locale: "en" },
  loaders: [mswLoader],
  decorators: [
    withThemeByClassName({
      defaultTheme: "light",
      themes: { light: "", dark: "dark" },
    }),
    (Story, context) => {
      const mockAddress = context.parameters.mockWalletAddress
      setMockAddress(mockAddress)

      const { i18n } = useTranslation()
      const { locale } = context.globals
      useEffect(() => {
        if (locale) i18n.changeLanguage(locale)
      }, [locale])

      const storybookTheme = context.globals.theme
      const isPageStory = context.title.startsWith("Pages/")
      if (isPageStory) context.parameters.layout = "fullscreen"

      return (
        <QueryClientProvider client={queryClient}>
          <Provider forcedTheme={storybookTheme}>
            <TransactionModalProvider>
              {isPageStory ? (
                <VStack minH="100vh" gap={0} align="stretch">
                  <Flex flex={1}>
                    <Container
                      flex={1}
                      my={{ base: 4, md: 10 }}
                      px={4}
                      maxW={{ base: "sm", md: "xl" }}
                      display={"flex"}
                      alignItems={"center"}
                      justifyContent={"flex-start"}
                      flexDirection={"column"}>
                      <Story />
                    </Container>
                  </Flex>
                </VStack>
              ) : (
                <Story />
              )}
            </TransactionModalProvider>
          </Provider>
        </QueryClientProvider>
      )
    },
  ],
}

export default preview

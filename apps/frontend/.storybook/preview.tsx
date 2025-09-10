import React from "react"
import type { Preview } from "@storybook/nextjs-vite"
import { ChakraProvider } from "@chakra-ui/react"
import { withThemeByClassName } from "@storybook/addon-themes"
import theme from "../src/app/theme/theme"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  decorators: [
    withThemeByClassName({
      defaultTheme: "light",
      themes: { light: "", dark: "dark" },
    }),
    Story => (
      <ChakraProvider value={theme}>
        <Story />
      </ChakraProvider>
    ),
  ],
}

export default preview

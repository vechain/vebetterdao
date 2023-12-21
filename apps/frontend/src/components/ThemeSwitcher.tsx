import React from "react"
import { Button, Icon, useColorMode } from "@chakra-ui/react"
import { FaMoon, FaSun } from "react-icons/fa"

export const ThemeSwitcher: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === "dark"
  const text = isDark ? "Dark" : "Light"
  return (
    <Button
      data-cy="theme-switcher-with-text"
      aria-label={isDark ? "dark" : "light"}
      fontSize="18px"
      leftIcon={<Icon as={isDark ? FaSun : FaMoon} />}
      onClick={toggleColorMode}>
      {text}
    </Button>
  )
}

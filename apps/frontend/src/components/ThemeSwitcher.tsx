import React from "react"
import { Button, ButtonProps, Icon, IconButton } from "@chakra-ui/react"
import { useColorMode } from "@/components/ui/color-mode"
import { FaMoon, FaSun } from "react-icons/fa"

type Props = {
  withText?: boolean
} & ButtonProps

export const ThemeSwitcher: React.FC<Props> = ({ withText, ...otherProps }) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === "dark"
  const text = isDark ? "Dark" : "Light"
  if (!withText)
    return (
      <IconButton
        data-cy="theme-switcher"
        aria-label={isDark ? "dark" : "light"}
        textStyle="lg"
        bg="none"
        borderRadius="full"
        onClick={toggleColorMode}
        {...otherProps}>
        <Icon as={isDark ? FaSun : FaMoon} />
      </IconButton>
    )

  return (
    <Button
      data-cy="theme-switcher-with-text"
      aria-label={isDark ? "dark" : "light"}
      textStyle="lg"
      variant="ghost"
      borderRadius="full"
      onClick={toggleColorMode}
      {...otherProps}>
      <Icon as={isDark ? FaSun : FaMoon} />
      {text}
    </Button>
  )
}

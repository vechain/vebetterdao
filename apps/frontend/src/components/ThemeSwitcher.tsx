import React from "react"
import { Button, ButtonProps, Icon, IconButton, useColorMode } from "@chakra-ui/react"
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
        fontSize="18px"
        icon={<Icon as={isDark ? FaSun : FaMoon} />}
        onClick={toggleColorMode}
        {...otherProps}
      />
    )

  return (
    <Button
      data-cy="theme-switcher-with-text"
      aria-label={isDark ? "dark" : "light"}
      fontSize="18px"
      leftIcon={<Icon as={isDark ? FaSun : FaMoon} />}
      onClick={toggleColorMode}
      {...otherProps}>
      {text}
    </Button>
  )
}

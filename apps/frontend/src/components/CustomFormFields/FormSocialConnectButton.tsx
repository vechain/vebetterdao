import { Button, FormControl, FormErrorMessage, Input, Text } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"
import { UilCheck } from "@iconscout/react-unicons"

type FormSocialConnectButtonProps = {
  label: string
  description?: string
  register: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
  handleAuth: () => void
  leftIcon: React.ReactElement
  value: string
}

export const FormSocialConnectButton = ({
  label,
  register,
  error,
  handleAuth,
  leftIcon,
  value,
}: FormSocialConnectButtonProps) => {
  const isConnected = !!value
  const backgroundColor = isConnected ? "black" : "white"
  const color = isConnected ? "white" : "black"
  const borderColor = isConnected ? "black" : "gray.200"
  return (
    <FormControl isInvalid={!!error}>
      <Button
        backgroundColor={backgroundColor}
        color={color}
        border="1px solid"
        borderColor={borderColor}
        onClick={handleAuth}
        borderRadius="md"
        w="full"
        {...(isConnected && { rightIcon: <UilCheck /> })}
        alignItems="center"
        justifyContent="center"
        gap={2}>
        {leftIcon}
        <Text isTruncated>{label}</Text>
      </Button>
      <Input type="hidden" {...register} />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

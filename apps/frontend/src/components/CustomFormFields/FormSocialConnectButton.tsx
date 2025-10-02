import { Button, Field, Icon, Input, Text } from "@chakra-ui/react"
import { UseFormRegisterReturn } from "react-hook-form"
import { BsCheck } from "react-icons/bs"

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
    <Field.Root invalid={!!error}>
      <Button
        backgroundColor={backgroundColor}
        color={color}
        border="1px solid"
        borderColor={borderColor}
        onClick={handleAuth}
        borderRadius="md"
        w="full"
        alignItems="center"
        justifyContent="center"
        gap={2}>
        {leftIcon}
        <Text truncate>{label}</Text>
        {isConnected && <Icon as={BsCheck} />}
      </Button>
      <Input type="hidden" {...register} />
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  )
}

import { Button, FormControl, FormErrorMessage, Input } from "@chakra-ui/react"
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
  return (
    <FormControl isInvalid={!!error}>
      <Button
        backgroundColor={"black"}
        color={"white"}
        onClick={handleAuth}
        alignSelf="flex-end"
        borderRadius="md"
        leftIcon={leftIcon}
        {...(value && { rightIcon: <UilCheck /> })}>
        {value || label}
      </Button>
      <Input type="hidden" {...register} />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

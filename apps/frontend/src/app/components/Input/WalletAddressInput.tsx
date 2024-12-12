import { useEffect, useId } from "react"
import { Input, InputProps } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UseFormRegister, UseFormWatch, type FieldValues as TFieldValues } from "react-hook-form"
import { useVechainDomain } from "@vechain/dapp-kit-react"
import { isValid } from "@repo/utils/AddressUtils"

type Props = InputProps & {
  inputName: string
  register: UseFormRegister<TFieldValues>
  watch: UseFormWatch<TFieldValues>
  onDomainResolved?: (domain?: string) => void
  onAddressResolved?: (address?: string) => void
}

export const WalletAddressInput = ({
  inputName,
  register,
  watch,
  onDomainResolved,
  onAddressResolved,
  ...props
}: Props) => {
  const id = useId()
  const { t } = useTranslation()

  // Watch the input value directly from react-hook-form
  const inputValue = watch(inputName)

  // Resolve the domain or address based on the current input value
  const { domain, address } = useVechainDomain({
    addressOrDomain: inputValue,
  })

  // Notify parent components when the domain or address changes
  useEffect(() => {
    onDomainResolved?.(domain)
    onAddressResolved?.(address)
  }, [domain, address, onDomainResolved, onAddressResolved])

  return (
    <Input
      {...props}
      id={id}
      {...register(inputName, {
        required: t("Wallet address or domain is required"),
        validate: (value: string) => {
          //Default Validation is only against wallet address
          if (value.startsWith("0x") && !isValid(value)) {
            return t("Please enter a valid wallet address")
          }
        },
      })}
      value={inputValue}
      placeholder={props?.placeholder || t("Enter a wallet address or domain")}
    />
  )
}

import { useEffect, useId } from "react"
import { Input } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UseFormRegister, UseFormWatch } from "react-hook-form"
import { useVechainDomain } from "@vechain/dapp-kit-react"
import { isValid } from "@repo/utils/AddressUtils"

type Props = {
  inputName: string
  //TODO: Replace any with the correct type
  register: UseFormRegister<any>
  watch: UseFormWatch<any>
  customValidation?: (value: string) => boolean | string | Promise<boolean | string>
  onDomainResolved?: (domain?: string) => void
  onAddressResolved?: (address?: string) => void
}

export const WalletAddressInput = ({
  inputName,
  register,
  watch,
  customValidation,
  onDomainResolved,
  onAddressResolved,
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

  //Default Validation is only against wallet address
  const validateInput = async (value: string) => {
    //Check if starts with 0x
    if (value.startsWith("0x") && !isValid(value)) {
      return t("Please enter a valid wallet address")
    }
  }

  return (
    <Input
      id={id}
      {...register(inputName, {
        required: t("Wallet address or domain is required"),
        validate: async (value: string) => {
          await validateInput(value)

          //Allows custom validation to be passed
          if (customValidation) {
            const result = await customValidation(value)
            if (result !== true) return result
          }
          return true
        },
      })}
      value={inputValue}
      placeholder={t("Enter your wallet address or domain")}
    />
  )
}

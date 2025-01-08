import { useEffect, useId } from "react"
import { Input, InputProps } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import {
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormWatch,
  type FieldValues as TFieldValues,
} from "react-hook-form"
import { useVechainDomain, useConnex } from "@vechain/dapp-kit-react"
import { isValid } from "@repo/utils/AddressUtils"
import { isValidDomain } from "@/utils/VetDomainUtils/VetDomainUtils"

type Props = InputProps & {
  inputName: string
  register: UseFormRegister<TFieldValues>
  watch: UseFormWatch<TFieldValues>
  setError: UseFormSetError<TFieldValues>
  clearErrors: UseFormClearErrors<TFieldValues>
  onDomainResolved?: (domain?: string) => void
  onAddressResolved?: (address?: string) => void
}

export const WalletAddressInput = ({
  inputName,
  register,
  watch,
  setError,
  clearErrors,
  onDomainResolved,
  onAddressResolved,
  ...props
}: Props) => {
  const id = useId()
  const { t } = useTranslation()
  const { thor } = useConnex()

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

  useEffect(() => {
    const validateInput = async () => {
      //Clear Previous Errors
      if (clearErrors) clearErrors(inputName)

      //Skip Validation if no input
      if (!inputValue) return

      //If the setError function is not provided, skip the validation
      if (!setError) {
        return
      }

      //Not Valid Address or Domain
      if (!isValid(inputValue) && !inputValue.endsWith(".vet")) {
        setError(inputName, { type: "manual", message: t("Please enter a valid wallet address or domain") })
      }

      //Not Valid Address
      if (inputValue.startsWith("0x") && !isValid(inputValue)) {
        setError(inputName, { type: "manual", message: t("Please enter a valid wallet address") })
      }

      //Not Valid Domain
      if (!inputValue.startsWith("0x") && inputValue.endsWith(".vet")) {
        const isDomainValid = await isValidDomain(inputValue, thor)
        if (!isDomainValid) {
          setError(inputName, { type: "manual", message: t("Please enter a valid domain") })
        }
      }
    }

    validateInput()
  }, [inputValue, setError, clearErrors, inputName, t, thor])

  return (
    <Input
      {...props}
      id={id}
      {...register(inputName, {
        required: t("Wallet address or domain is required"),
        validate: (value: string) => {
          if (!isValid(value) && !value.endsWith(".vet")) {
            return t("Please enter a valid wallet address or domain")
          }

          if (value.startsWith("0x") && !isValid(value)) {
            return t("Please enter a valid wallet address")
          }
        },
      })}
      value={inputValue}
      placeholder={props?.placeholder ?? t("Enter a wallet address or domain")}
    />
  )
}

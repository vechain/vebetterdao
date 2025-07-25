import { useId, useState, useEffect, useRef, useCallback } from "react"
import { Input, InputGroup, InputProps, Field } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useVechainDomain } from "@vechain/vechain-kit"
import { isValid as isWalletAddressValid } from "@repo/utils/AddressUtils"

type Props = InputProps & {
  onDomainResolved?: (domain?: string) => void
  onAddressResolved?: (address?: string) => void
  customValidation?: ({ address }: { address?: string }) => string
  startAddon?: React.ReactNode
}

export const WalletAddressInput = ({
  onDomainResolved,
  onAddressResolved,
  customValidation,
  startAddon,
  ...props
}: Props) => {
  const id = useId()
  const { t } = useTranslation()

  const [inputValue, setInputValue] = useState((props?.defaultValue as string) ?? "")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Tracks last resolved value (address or domain)
  const lastResolvedValue = useRef<string | undefined>()
  // Tracks if the parent was notified of invalid input
  const hasNotifiedInvalid = useRef(false)

  // Resolve the domain or address using the input value
  const { data: vnsData } = useVechainDomain(inputValue)
  const domain = vnsData?.domain
  const address = vnsData?.address

  const handleOnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  /**
   * Notify the parent if the input resolves to a wallet address or a domain with an associated address
   * - Notify the parent only once when the input transitions to a valid state
   * - Reset the last resolved value when the input is invalid
   */
  const notifyParentResolved = useCallback(() => {
    const resolvedValue = address ?? domain

    if ((isWalletAddressValid(inputValue) && inputValue === address) || (domain && address)) {
      //If already resolved, do not notify parent again
      if (resolvedValue === lastResolvedValue.current) return

      lastResolvedValue.current = resolvedValue

      if (domain) onDomainResolved?.(domain)
      if (address) onAddressResolved?.(address)

      // Reset invalidation flag when resolved
      hasNotifiedInvalid.current = false
    }
  }, [inputValue, domain, address, onDomainResolved, onAddressResolved])

  /**
   * Notify the parent of invalid input
   * - Notify the parent only once when input transitions to invalid
   * - Reset last resolved value when invalid
   * - Reset invalidation flag when resolved
   **/
  const notifyInvalidInput = useCallback(() => {
    // Notify parent only once when input transitions to invalid
    if (!hasNotifiedInvalid.current) {
      onDomainResolved?.(undefined)
      onAddressResolved?.(undefined)
      hasNotifiedInvalid.current = true
    }

    // Reset last resolved value when invalid
    lastResolvedValue.current = undefined
  }, [onDomainResolved, onAddressResolved])

  /**
   * Validate the input value on every change
   */
  useEffect(() => {
    const validateInput = () => {
      if (!inputValue) {
        setErrorMessage(null)
        notifyInvalidInput()
        return
      }
      if (customValidation) {
        const errorMsg = customValidation({ address })
        if (errorMsg) {
          setErrorMessage(errorMsg ?? t("Invalid address"))
          notifyInvalidInput()
          return
        }
      }

      if (!inputValue.startsWith("0x") && inputValue.endsWith(".vet") && !domain) {
        setErrorMessage(t("Please enter a valid domain"))
        notifyInvalidInput()
        return
      }

      if (!isWalletAddressValid(inputValue) && !inputValue.endsWith(".vet")) {
        setErrorMessage(t("Please enter a valid wallet address or domain"))
        notifyInvalidInput()
        return
      }

      if (inputValue.startsWith("0x") && !isWalletAddressValid(inputValue)) {
        setErrorMessage(t("Please enter a valid wallet address"))
        notifyInvalidInput()
        return
      }

      setErrorMessage(null)
      notifyParentResolved()
    }

    validateInput()
  }, [inputValue, domain, address, t, notifyParentResolved, notifyInvalidInput, customValidation])

  return (
    <Field.Root invalid={!!errorMessage}>
      <InputGroup startElement={startAddon}>
        <Input
          {...props}
          id={id}
          value={inputValue}
          onChange={handleOnChange}
          placeholder={props?.placeholder ?? t("Enter a wallet address or domain")}
          disabled={props?.disabled}
          required={props?.required ?? true}
        />
      </InputGroup>
      {errorMessage && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
    </Field.Root>
  )
}

import { Button, HStack, HTMLChakraProps, Text, useClipboard, Icon } from "@chakra-ui/react"
import React, { useEffect } from "react"
import { AddressIcon } from "./AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { FaCheck, FaCopy } from "react-icons/fa6"

interface IAddressButton extends HTMLChakraProps<"button"> {
  address: string
  showAddressIcon?: boolean
  showCopyIcon?: boolean
  addressFontSize?: string
  buttonSize?: string
}
export const AddressButton: React.FC<IAddressButton> = ({
  address,
  showAddressIcon = true,
  showCopyIcon = true,
  addressFontSize = "md",
  buttonSize = "md",
  ...props
}) => {
  const { onCopy, hasCopied, setValue } = useClipboard(address)

  const { onClick, ...otherProps } = props

  const onClickHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onClick) onClick(e)
    if (showCopyIcon) onCopy()
  }

  useEffect(() => {
    setValue(address)
  }, [address, setValue])

  const spacing = ["xs", "sm"].includes(buttonSize) ? 2 : 4

  return (
    <Button
      data-cy={`address-button-${address}`}
      size={buttonSize}
      colorScheme={"gray"}
      onClick={onClickHandler}
      {...(showAddressIcon && { paddingLeft: 0 })}
      paddingY={0}
      variant="outline"
      {...otherProps}>
      <HStack justify={"flex-start"} spacing={spacing} h="full" roundedLeft={"md"}>
        {showAddressIcon && <AddressIcon address={address} roundedLeft={"md"} />}
        <Text fontSize={addressFontSize}>{humanAddress(address, 6, 4)}</Text>
        {showCopyIcon && (
          <Icon data-cy="address-button-copy-icon" aria-label="Copy Address" as={hasCopied ? FaCheck : FaCopy} />
        )}
      </HStack>
    </Button>
  )
}

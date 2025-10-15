import { Button, HStack, Text, useClipboard, Icon, ButtonProps } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import React, { useEffect } from "react"
import { FaCheck, FaCopy } from "react-icons/fa6"

import { AddressIcon, IAddressIcon } from "./AddressIcon"

interface IAddressButton extends ButtonProps {
  address: string
  showAddressIcon?: boolean
  showCopyIcon?: boolean
  addressFontSize?: string
  buttonSize?: ButtonProps["size"]
  addressIconProps?: Omit<IAddressIcon, "address">
  digitsBeforeEllipsis?: number
  digitsAfterEllipsis?: number
}
export const AddressButton: React.FC<IAddressButton> = ({
  address,
  showAddressIcon = true,
  showCopyIcon = true,
  addressFontSize = "md",
  buttonSize = "md",
  addressIconProps = {},
  digitsBeforeEllipsis = 6,
  digitsAfterEllipsis = 4,
  ...props
}) => {
  const { copy: onCopy, copied: hasCopied, setValue } = useClipboard({ value: address })
  const { onClick, ...otherProps } = props
  const onClickHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onClick) onClick(e)
    if (showCopyIcon) onCopy()
  }
  useEffect(() => {
    setValue(address)
  }, [address, setValue])
  const spacing = buttonSize === "xs" || buttonSize === "sm" ? 1 : 2
  return (
    <Button
      data-cy={`address-button-${address}`}
      size={buttonSize}
      colorPalette={"gray"}
      onClick={onClickHandler}
      {...(showAddressIcon && { paddingLeft: 0 })}
      paddingY={0}
      variant="outline"
      {...otherProps}>
      <HStack justify={"flex-start"} gap={spacing} roundedLeft={"md"}>
        {showAddressIcon && <AddressIcon address={address} roundedLeft={"md"} {...addressIconProps} />}
        <Text textStyle={addressFontSize}>{humanAddress(address, digitsBeforeEllipsis, digitsAfterEllipsis)}</Text>
        {showCopyIcon && (
          <Icon
            data-cy="address-button-copy-icon"
            boxSize={3}
            aria-label="Copy Address"
            as={hasCopied ? FaCheck : FaCopy}
          />
        )}
      </HStack>
    </Button>
  )
}

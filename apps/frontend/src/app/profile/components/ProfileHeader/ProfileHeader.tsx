import React, { useState, useEffect, useCallback } from "react"
import { Text, VStack, HStack, Card, CardBody, useClipboard, IconButton } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { UilCopy, UilCheck } from "@iconscout/react-unicons"
import { useWalletName } from "@vechain.energy/dapp-kit-hooks"

type Props = {
  address: string
}

export const ProfileHeader = ({ address }: Props) => {
  const { name } = useWalletName(address ?? "")
  const { onCopy } = useClipboard(address ?? "")
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopy = useCallback(() => {
    onCopy()
    setIsCopied(true)
  }, [onCopy])

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <HStack gap={4}>
            <AddressIcon address={address ?? ""} rounded={"full"} h={12} />
            <VStack align="stretch" spacing={2} flex={1}>
              <HStack justify="space-between">
                <HStack align="flex-start" w="full">
                  <Text fontSize="xl" fontWeight="bold" borderRight={"2px solid #E0E0E0"} paddingRight={2}>
                    {name}
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {humanAddress(address ?? "")}
                  </Text>
                </HStack>
                <IconButton
                  variant="ghost"
                  rounded="full"
                  icon={isCopied ? <UilCheck color="green" /> : <UilCopy />}
                  onClick={handleCopy}
                  aria-label="Copy Address"
                />
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

import React, { useState, useEffect, useCallback } from "react"
import { Text, VStack, HStack, Card, CardBody, useClipboard, IconButton } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { UilCopy, UilCheck } from "@iconscout/react-unicons"

export const ProfileHeader = () => {
  const { account } = useWallet()
  const { onCopy } = useClipboard(account || "")
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
            <AddressIcon address={account || ""} rounded={"full"} h={12} />
            <VStack align="stretch" spacing={2} flex={1}>
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">
                  {humanAddress(account || "")}
                </Text>
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

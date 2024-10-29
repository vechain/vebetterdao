import React, { useState, useEffect, useCallback } from "react"
import { Text, VStack, HStack, Card, CardBody, useClipboard, IconButton, Stack, Heading } from "@chakra-ui/react"
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
          <HStack spacing={4}>
            <AddressIcon address={address ?? ""} rounded={"full"} boxSize={12} />
            <Stack
              direction={["column", "column", "column"]}
              align={["flex-start", "flex-start", "column"]}
              w="full"
              spacing={1}>
              <Heading fontSize="xl">{name}</Heading>
              <HStack spacing={2}>
                <Text fontSize="xl" fontWeight="500">
                  {humanAddress(address ?? "", 6, 4)}
                </Text>

                <IconButton
                  variant="link"
                  colorScheme={isCopied ? "green" : "primary"}
                  icon={isCopied ? <UilCheck /> : <UilCopy />}
                  onClick={handleCopy}
                  aria-label="Copy Address"
                />
              </HStack>
            </Stack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

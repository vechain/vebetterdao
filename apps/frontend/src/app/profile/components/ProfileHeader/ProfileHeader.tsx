import React, { useState, useEffect, useCallback } from "react"
import { Text, VStack, HStack, Card, useClipboard, IconButton, Stack, Heading, Icon } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { UilCopy, UilCheck } from "@iconscout/react-unicons"
import { useVechainDomain } from "@vechain/vechain-kit"

type Props = {
  address: string
}

export const ProfileHeader = ({ address }: Props) => {
  const { data: vnsData } = useVechainDomain(address ?? "")
  const domain = vnsData?.domain
  const { copy } = useClipboard({ value: address ?? "" })
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopy = useCallback(() => {
    copy()
    setIsCopied(true)
  }, [copy])

  return (
    <Card.Root variant="primary">
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <HStack gap={4}>
            <AddressIcon address={address ?? ""} rounded={"full"} minW={14} minH={14} boxSize={14} />
            <Stack
              direction={["column", "column", "column"]}
              align={["flex-start", "flex-start", "column"]}
              w="full"
              gap={1}>
              <Heading textStyle="xl">{humanDomain(domain ?? "", 15)}</Heading>
              <HStack gap={2}>
                <Text textStyle="xl" fontWeight="500">
                  {humanAddress(address ?? "", 6, 4)}
                </Text>

                <IconButton
                  boxSize={6}
                  variant="plain"
                  color={isCopied ? "green" : "primary"}
                  onClick={handleCopy}
                  aria-label="Copy Address">
                  <Icon as={isCopied ? UilCheck : UilCopy} boxSize={6} />
                </IconButton>
              </HStack>
            </Stack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

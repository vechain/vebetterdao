import React from "react"
import { Text, VStack, HStack, Card, CardBody } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { UserSustainabilityOverviewStats } from "@/components"

export const ProfileHeader = () => {
  const { account } = useWallet()

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <HStack gap={4}>
            <AddressIcon address={account || ""} rounded={"full"} h={12} />
            <VStack align="stretch" spacing={2} flex={1}>
              <Text fontSize="xl" fontWeight="bold">
                {humanAddress(account || "")}
              </Text>
              <HStack spacing={2}>
                {/* {tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))} */}
              </HStack>
            </VStack>
          </HStack>
          <UserSustainabilityOverviewStats />
        </VStack>
      </CardBody>
    </Card>
  )
}

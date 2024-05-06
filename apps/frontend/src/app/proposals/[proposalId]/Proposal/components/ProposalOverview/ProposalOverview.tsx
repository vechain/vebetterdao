import { Divider, Flex, HStack, Heading, IconButton, Spacer, Text, VStack } from "@chakra-ui/react"
import { BaseCard } from "../../../components/BaseCard"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { FaRegBell, FaRegClock, FaShareNodes, FaTriangleExclamation } from "react-icons/fa6"
import { VOT3Icon } from "@/components"

export const ProposalOverview = () => {
  // TODO: should we move colors variables to theme?
  // TODO: fill below data with real data
  // TODO: is there i18n?
  // TODO: font-size should be in theme?
  // TODO: vot3 icon is different from figma
  // TODO: how to handle notify button?
  // TODO: icons are different (attention and share)
  const round = 15 // TODO: is this the round number? or the proposal round?
  const title = "This is the proposal title"
  const isDepositPending = true
  const description =
    "This section serves as the proposal description, where users have the opportunity to concisely articulate their idea or initiative for consideration within the DAO ecosystem. Here, users can provide a detailed overview of their proposal, outlining its objectives, rationale, and potential benefits. Through clear and co. This section serves as the proposal description, where users have the opportunity to concisely articulate their idea or initiative for consideration within the DAO ecosystem. Here, users can provide a detailed overview of their proposal, outlining its objectives, rationale, and potential benefits. Through clear and co"
  const creator = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa"
  const startsInDate = "3 days"
  const deposited = 1000
  const totalDeposit = 10000

  return (
    <BaseCard>
      <Flex gap="48px">
        <VStack gap={"20px"} alignItems={"stretch"} flex={3}>
          <VStack alignItems={"stretch"}>
            <Text fontWeight={"600"} color="#6A6A6A">
              ROUND #{round}
            </Text>
            <Heading fontWeight={700} fontSize="36px" color="#252525">
              {title}
            </Heading>
            <Text fontWeight={"600"} color={isDepositPending ? "#F29B32" : "#6194F5"}>
              {isDepositPending ? "VOT3 deposit pending" : "Upcoming voting"}
            </Text>
            <Spacer h={"24px"} />
            <Text color="#252525">{description}</Text>
          </VStack>
          <Divider color="#D5D5D5" />
          <HStack justify={"space-between"}>
            <HStack gap={"48px"}>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  Created by
                </Text>
                <HStack>
                  <AddressIcon address={creator} rounded="full" h="20px" w="20px" />
                  <Text color="#252525">{humanAddress(creator, 7, 5)}</Text>
                </HStack>
              </VStack>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  Starts in
                </Text>
                <HStack>
                  <FaRegClock />
                  <Text color="#252525">{startsInDate}</Text>
                </HStack>
              </VStack>
              <VStack alignItems={"stretch"}>
                <Text fontWeight={"400"} color="#6A6A6A">
                  VOT3 deposit
                </Text>
                <HStack>
                  <VOT3Icon h="20px" w="20px" />
                  <Text color="#252525">
                    <Text color="#6A6A6A" display={"inline-flex"}>
                      {deposited}
                    </Text>
                    /{totalDeposit}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
            <HStack>
              <IconButton aria-label="notify" rounded="full" bgColor="#E0E9FE" color="#004CFC" h="40px" w="40px">
                <FaRegBell size="20px" />
              </IconButton>
              <IconButton aria-label="share" rounded="full" bgColor="#E0E9FE" color="#004CFC" h="40px" w="40px">
                <FaShareNodes size="20px" />
              </IconButton>
            </HStack>
          </HStack>
        </VStack>
        <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
          <VStack p="32px">
            <FaTriangleExclamation size="60px" color="#F29B32" />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              This proposal has to reach the necessary VOT3 before
            </Text>
            <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
              3d 16h 12m
            </Text>
          </VStack>
        </Flex>
      </Flex>
    </BaseCard>
  )
}

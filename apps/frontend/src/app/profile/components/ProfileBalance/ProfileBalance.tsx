import React from "react"
import { Box, Heading, Text, Button, Card, CardBody, HStack, useDisclosure, Skeleton } from "@chakra-ui/react"
import { FaRepeat } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useB3trBalance, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { ConvertModal } from "@/components/Convert/ConvertModal"

export const ProfileBalance = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useB3trBalance(account ?? undefined)
  const { data: v3Balance, isLoading: isV3BalanceLoading } = useVot3Balance(account ?? undefined)
  const { isOpen, onClose, onOpen } = useDisclosure()
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <Heading as="h6" size="md" mb={4}>
          {t("Your tokens")}
        </Heading>
        <HStack align="center" justify="space-between">
          <Skeleton isLoaded={!isB3trBalanceLoading} w="100px">
            <Box bg="gray.100" p={3} borderRadius="md" flex={1} mr={2}>
              <Text fontSize="sm" fontWeight="bold">
                {b3trBalance?.formatted} {t("B3TR")}
              </Text>
            </Box>
          </Skeleton>
          <Button variant="primaryAction" size="sm" p={2} minW="auto" onClick={onOpen}>
            <FaRepeat />
          </Button>
          <Skeleton isLoaded={!isV3BalanceLoading} w="100px">
            <Box bg="gray.100" p={3} borderRadius="md" flex={1} ml={2}>
              <Text fontSize="sm" fontWeight="bold">
                {v3Balance?.formatted} {t("VOT3")}
              </Text>
            </Box>
          </Skeleton>
        </HStack>
      </CardBody>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </Card>
  )
}

import React from "react"
import { Box, Heading, Text, Button, Card, CardBody, HStack, useDisclosure, Skeleton } from "@chakra-ui/react"
import { FaRepeat } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useB3trBalance, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { ConvertModal } from "@/components/Convert/ConvertModal"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const compactFormatter = getCompactFormatter(0)

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
        <HStack align="center">
          <Skeleton isLoaded={!isB3trBalanceLoading} w="100px" flex={1}>
            <Box bg="gray.100" p={3} borderRadius="md" flex={1} py={5} px={3}>
              <Text fontSize="md" fontWeight="bold">
                {compactFormatter.format(Number(b3trBalance?.scaled ?? 0))} {t("B3TR")}
              </Text>
            </Box>
          </Skeleton>

          <Skeleton isLoaded={!isV3BalanceLoading} w="100px" flex={1}>
            <Box bg="gray.100" p={3} borderRadius="md" flex={1} py={5} px={3} pl={6}>
              <Text fontSize="md" fontWeight="bold">
                {compactFormatter.format(Number(v3Balance?.scaled ?? 0))} {t("VOT3")}
              </Text>
            </Box>
          </Skeleton>
          <Button
            variant="primaryAction"
            size="sm"
            p={2}
            minW="auto"
            onClick={onOpen}
            position="absolute"
            left={"calc(50% - 20px)"}
            w="40px"
            h="40px">
            <FaRepeat />
          </Button>
        </HStack>
      </CardBody>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </Card>
  )
}

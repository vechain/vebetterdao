import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  HStack,
  Heading,
  Icon,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { IoAddCircleOutline, IoWalletOutline } from "react-icons/io5"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useAppBalance, useAppAllowance } from "@/api/contracts/x2EarnRewardsPool"
import { WithdrawModal } from "./WithdrawModal"
import { DepositModal } from "./DepositModal"
import { B3TRIcon, BaseTooltip } from "@/components"
import { FiInfo } from "react-icons/fi"
import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountAppPermissions } from "@/api"
import { useMemo } from "react"

const compactFormatter = getCompactFormatter(4)

export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { isOpen: isOpenWithdraw, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure()
  const { isOpen: isOpenDeposit, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure()
  const { app } = useCurrentAppInfo()
  const { data: balance, isLoading: isBalanceLoading } = useAppBalance(app?.id ?? "")
  const { account } = useWallet()
  const { data: allowance, isLoading: isAllowanceLoading } = useAppAllowance(app?.id ?? "")
  const { data: appPermissions } = useAccountAppPermissions(account ?? "")

  const isAppAdmin = useMemo(() => {
    if (!appPermissions || !app) return false
    return appPermissions[app.id]?.isAdmin
  }, [appPermissions, app])

  // verify the allowance, if the amount to withdraw is higher than the amount allowed, the border turn red and the withdraw button is disabled
  const isAllowanceSufficient = useMemo(() => {
    if (!allowance?.scaled || !balance?.scaled) return false
    return Number(allowance.scaled) > Number(balance.scaled)
  }, [allowance, balance])

  console.log({ allowance, balance, isAllowanceSufficient, isAllowanceLoading })

  return (
    <>
      <Card w={"full"} variant="baseWithBorder">
        <CardHeader>
          <HStack justify={"space-between"} w={"full"}>
            <Heading size="md">{t("Rewards Pool")}</Heading>
            <BaseTooltip text={t("Total amount of B3TR tokens that the app has available for rewards distribution.")}>
              <span>
                <Icon as={FiInfo} color="rgba(0, 76, 252, 1)" position={"relative"} />
              </span>
            </BaseTooltip>
          </HStack>
        </CardHeader>
        <CardBody py={0}>
          <VStack spacing={4} w="full">
            <VStack bg={"#E5EEFF"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"} align="start">
              <Text fontSize="12px" fontWeight="400">
                {t("Total B3TR Balance")}
              </Text>
              <HStack>
                <B3TRIcon boxSize={"30px"} />
                <Skeleton isLoaded={!isBalanceLoading}>
                  <Heading size={{ base: "2xl", md: "xl" }}>{compactFormatter.format(Number(balance?.scaled))}</Heading>
                </Skeleton>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
        <CardFooter>
          <VStack spacing={2} w={"full"}>
            <Button mt={2} onClick={onOpenDeposit} variant={"primaryAction"} borderRadius={"full"} w={"full"}>
              <Icon as={IoAddCircleOutline} mr={2} />
              {t("Deposit")}
            </Button>
            {isAppAdmin && (
              <Button
                mt={2}
                isDisabled={balance?.scaled === "0.0" || !balance || isBalanceLoading}
                onClick={onOpenWithdraw}
                variant={"primaryAction"}
                borderRadius={"full"}
                w={"full"}>
                <Icon as={IoWalletOutline} mr={2} />
                {t("Withdraw")}
              </Button>
            )}
          </VStack>
        </CardFooter>
      </Card>

      {app && (
        <>
          <DepositModal appId={app.id} isOpen={isOpenDeposit} onClose={onCloseDeposit} />
          <WithdrawModal
            appId={app.id}
            teamWalletAddress={app?.teamWalletAddress}
            isOpen={isOpenWithdraw}
            onClose={onCloseWithdraw}
          />
        </>
      )}
    </>
  )
}

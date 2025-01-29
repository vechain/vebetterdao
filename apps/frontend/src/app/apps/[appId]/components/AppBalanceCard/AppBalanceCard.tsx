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
import { IoAddCircleOutline, IoWalletOutline, IoLockClosedOutline } from "react-icons/io5"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { WithdrawModal } from "./WithdrawModal"
import { DepositModal } from "./DepositModal"
import { LockAppTreasuryModal } from "./LockAppTreasuryModal"
import { B3TRIcon, BaseTooltip } from "@/components"
import { FiInfo } from "react-icons/fi"
import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountAppPermissions } from "@/api"
import { useMemo } from "react"
import { useAppBalance } from "@/api/contracts/x2EarnRewardsPool"

const compactFormatter = getCompactFormatter(4)

export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { isOpen: isOpenWithdraw, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure()
  const { isOpen: isOpenDeposit, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure()
  const { isOpen: isOpenLock, onOpen: onOpenLock, onClose: onCloseLock } = useDisclosure()
  const { app } = useCurrentAppInfo()
  const { data: balance, isLoading: isBalanceLoading } = useAppBalance(app?.id ?? "")
  const { account } = useWallet()

  const { data: appPermissions } = useAccountAppPermissions(account ?? "")

  const isAppAdmin = useMemo(() => {
    if (!appPermissions || !app) return false
    return appPermissions[app.id]?.isAdmin
  }, [appPermissions, app])

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
        </CardBody>
        <CardFooter>
          <VStack spacing={2} w={"full"}>
            <Button mt={2} onClick={onOpenDeposit} variant={"primaryAction"} borderRadius={"full"} w={"full"}>
              <Icon as={IoAddCircleOutline} mr={2} />
              {t("Deposit")}
            </Button>
            {isAppAdmin && (
              <>
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
                <Button
                  mt={2}
                  isDisabled={balance?.scaled === "0.0" || !balance || isBalanceLoading}
                  onClick={onOpenLock}
                  variant={"primaryAction"}
                  borderRadius={"full"}
                  w={"full"}>
                  <Icon as={IoLockClosedOutline} mr={2} />
                  {t("Lock a treasury")}
                </Button>
              </>
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
          <LockAppTreasuryModal appId={app.id} isOpen={isOpenLock} onClose={onCloseLock} />
        </>
      )}
    </>
  )
}

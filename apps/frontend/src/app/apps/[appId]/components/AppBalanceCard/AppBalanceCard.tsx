import {
  Button,
  Card,
  Separator,
  HStack,
  Heading,
  IconButton,
  Skeleton,
  Text,
  Icon,
  VStack,
  useDisclosure,
  Box,
  Link,
} from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowDownToLine, LuArrowUpFromLine, LuRefreshCw, LuSettings } from "react-icons/lu"

import { useAppAvailableFunds } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useAppRewardsBalance } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppRewardsBalance"
import { useIsDistributionPaused } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsDistributionPaused"
import { useIsRewardsPoolEnabled } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsRewardsPoolEnabled"
import { useIsAppAdmin } from "../../../../../api/contracts/xApps/hooks/useIsAppAdmin"
import { GenericAlert } from "../../../../components/Alert/GenericAlert"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"

import { AppBalanceTxsHistory } from "./AppBalanceTxsHistory"
import { DepositModal } from "./DepositModal"
import { FundsManagementModal } from "./FundsManagementModal"
import { ManagementCenterModal } from "./ManagementCenterModal"
import { WithdrawModal } from "./WithdrawModal"

const compactFormatter = getCompactFormatter(2)
export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const {
    open: isOpenRewardsPoolAccess,
    onOpen: onOpenRewardsPoolAccess,
    onClose: onCloseRewardsPoolAccess,
  } = useDisclosure()
  const { open: isOpenDeposit, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure()
  const { open: isOpenWithdraw, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure()
  const { open: isOpenRebalance, onOpen: onOpenRebalance, onClose: onCloseRebalance } = useDisclosure()
  const {
    open: isOpenManagementCenter,
    onOpen: onOpenManagementCenter,
    onClose: onCloseManagementCenter,
  } = useDisclosure()

  const { app } = useCurrentAppInfo()
  const { data: balance, isLoading: isBalanceLoading } = useAppAvailableFunds(app?.id ?? "")
  const { data: rewardsBalance, isLoading: isRewardsBalanceLoading } = useAppRewardsBalance(app?.id ?? "")
  const { data: isRewardsPoolEnabled } = useIsRewardsPoolEnabled(app?.id ?? "")
  const { data: isPaused } = useIsDistributionPaused(app?.id ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account?.address ?? "")
  const isAppAdminOrTreasuryAddress = isAppAdmin || app?.teamWalletAddress === account?.address

  const rewardsPoolColor = useMemo(() => {
    if (isPaused) return "status.negative.subtle"
    if (isRewardsPoolEnabled) return "status.positive.primary"
    else return "bg.muted"
  }, [isPaused, isRewardsPoolEnabled])

  return (
    <>
      <Card.Root
        w={"full"}
        variant="primary"
        border="sm"
        borderColor={isPaused ? "status.negative.primary" : "border.primary"}>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <Heading size="xl">{t("App Funds")}</Heading>
            <Link
              textStyle="md"
              fontWeight="semibold"
              color="actions.secondary.text-lighter"
              onClick={onOpenRewardsPoolAccess}>
              {t("History")}
              <UilArrowUpRight />
            </Link>
          </HStack>
        </Card.Header>

        <Card.Body gap={6}>
          <VStack alignItems="start" gap={1} w="full">
            <Text textStyle="md" fontWeight="semibold">
              {t("Available Balance")}
            </Text>
            <Text textStyle="xs" color="text.subtle">
              {t("B3TR received from allocations. Deposit to add funds, withdraw to send to your team wallet.")}
            </Text>
          </VStack>
          <HStack justifyContent="space-between" alignItems="center" w={"full"}>
            <Skeleton loading={isBalanceLoading}>
              <Heading size={{ base: "2xl", md: "4xl" }}>{compactFormatter.format(Number(balance?.scaled))}</Heading>
            </Skeleton>
            <HStack gap={2}>
              <IconButton
                size="sm"
                aria-label={t("Deposit")}
                disabled={!isAppAdminOrTreasuryAddress}
                onClick={onOpenDeposit}
                variant="primary"
                borderRadius="full">
                <Icon as={LuArrowDownToLine} />
              </IconButton>
              <IconButton
                size="sm"
                aria-label={t("Withdraw")}
                disabled={!isAppAdminOrTreasuryAddress}
                onClick={onOpenWithdraw}
                variant="primary"
                borderRadius="full">
                <Icon as={LuArrowUpFromLine} />
              </IconButton>
            </HStack>
          </HStack>

          <Box position="relative" mx="-24px" width="calc(100% + 48px)">
            <Separator borderColor="border.primary" />
          </Box>

          <VStack alignItems={"start"} gap={2} w="full">
            <VStack alignItems="start" gap={1} w="full">
              <HStack alignItems="center">
                <Text textStyle="md" fontWeight="semibold">
                  {t("Rewards Distribution Pool")}
                </Text>
                <IconButton
                  variant="ghost"
                  size="xs"
                  aria-label="Pool settings"
                  disabled={!isAppAdmin}
                  onClick={onOpenManagementCenter}>
                  <Icon as={LuSettings} boxSize="4" color="icon.default" />
                </IconButton>
              </HStack>
              <Text textStyle="xs" color="text.subtle">
                {t("Funds reserved for rewarding users. Move B3TR here from your balance to distribute rewards.")}
              </Text>
            </VStack>
            <HStack justifyContent="space-between" alignItems="center" w="full" mt={4}>
              <Skeleton loading={isRewardsBalanceLoading}>
                <Heading size={{ base: "2xl", md: "4xl" }} color={rewardsPoolColor}>
                  {compactFormatter.format(Number(rewardsBalance?.scaled || 0))}
                </Heading>
              </Skeleton>
              <HStack gap={2}>
                <Button
                  size="sm"
                  disabled={!isAppAdmin}
                  onClick={onOpenRebalance}
                  variant="primary"
                  borderRadius="full">
                  <Icon as={LuRefreshCw} />
                  {t("Re-balance")}
                </Button>
                {isPaused && (
                  <Button
                    size="sm"
                    colorPalette="red"
                    disabled={!isAppAdmin}
                    onClick={onOpenManagementCenter}
                    borderRadius="full">
                    {t("Resume")}
                  </Button>
                )}
              </HStack>
            </HStack>
          </VStack>
          {!isAppAdmin && (
            <GenericAlert
              title={t("Access restricted")}
              type="warning"
              isLoading={false}
              message={t("Only app admin can transfer and manage the rewards pool")}
            />
          )}
        </Card.Body>
      </Card.Root>

      {app && (
        <>
          <AppBalanceTxsHistory appId={app.id} isOpen={isOpenRewardsPoolAccess} onClose={onCloseRewardsPoolAccess} />
          <DepositModal appId={app.id} isOpen={isOpenDeposit} onClose={onCloseDeposit} />
          <WithdrawModal
            appId={app.id}
            teamWalletAddress={app.teamWalletAddress ?? ""}
            isOpen={isOpenWithdraw}
            onClose={onCloseWithdraw}
          />
          <FundsManagementModal
            appId={app.id}
            isOpen={isOpenRebalance}
            onClose={onCloseRebalance}
            isEnablingRewardsPool={!isRewardsPoolEnabled}
            isRefillingPools={true}
          />
          <ManagementCenterModal
            appId={app.id}
            isOpen={isOpenManagementCenter}
            onClose={onCloseManagementCenter}
            b3trAppBalance={rewardsBalance?.scaled}
          />
        </>
      )}
    </>
  )
}

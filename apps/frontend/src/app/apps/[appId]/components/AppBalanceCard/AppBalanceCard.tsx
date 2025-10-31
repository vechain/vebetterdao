import {
  Button,
  Card,
  Separator,
  HStack,
  Stack,
  Heading,
  Skeleton,
  Text,
  Icon,
  VStack,
  useDisclosure,
  Box,
  Link,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiInfo } from "react-icons/fi"

import { Tooltip } from "@/components/ui/tooltip"

import { useAppAvailableFunds } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useAppRewardsBalance } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppRewardsBalance"
import { useIsDistributionPaused } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsDistributionPaused"
import { useIsRewardsPoolEnabled } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useIsRewardsPoolEnabled"
import { useIsAppAdmin } from "../../../../../api/contracts/xApps/hooks/useIsAppAdmin"
// Modal components
import { GenericAlert } from "../../../../components/Alert/GenericAlert"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"

import { AppBalanceTxsHistory } from "./AppBalanceTxsHistory"
import { ManagementCenterModal } from "./ManagementCenterModal"
import { TransferAppFundsModal } from "./TransferAppFundsModal"

const compactFormatter = getCompactFormatter(2)
export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const {
    open: isOpenRewardsPoolAccess,
    onOpen: onOpenRewardsPoolAccess,
    onClose: onCloseRewardsPoolAccess,
  } = useDisclosure()
  const {
    open: isOpenDepositOrWithdraw,
    onOpen: onOpenDepositOrWithdraw,
    onClose: onCloseDepositOrWithdraw,
  } = useDisclosure()

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
        colorPalette="Red"
        border="sm"
        borderColor={isPaused ? "status.negative.primary" : "border.primary"}>
        <Card.Body pt={3} pb={2}>
          <HStack justify={"space-between"} w={"full"}>
            <VStack alignItems={"start"} gap={0}>
              <HStack>
                <Text textStyle="md">{t("Balance")}</Text>
                <Tooltip
                  content={
                    <Text>
                      {t(
                        "Amount of B3TR tokens that the app has available for withdrawal, and that can be used to distribute rewards if the rewards pool is enabled.",
                      )}
                    </Text>
                  }>
                  <Icon as={FiInfo} color="icon.default" position={"relative"} />
                </Tooltip>
              </HStack>
              <Skeleton loading={isBalanceLoading}>
                <Heading size={{ base: "2xl", md: "4xl" }}>{compactFormatter.format(Number(balance?.scaled))}</Heading>
              </Skeleton>
            </VStack>

            <VStack gap={2}>
              <Button
                mt={1}
                disabled={!isAppAdminOrTreasuryAddress}
                onClick={onOpenDepositOrWithdraw}
                variant={"primary"}
                borderRadius={"full"}
                w={"full"}>
                {t("Transfer")}
              </Button>
            </VStack>
          </HStack>
          {/* Manage App Funds Section*/}
          <Box position="relative" my={2} pt={3} mx="-24px" width="calc(100% + 48px)">
            <Separator borderColor="border.primary" />
          </Box>

          <Stack direction="row" w="full" justifyContent={"space-between"} alignItems="center" pt={2}>
            <VStack alignItems={"start"} gap={0}>
              <HStack alignItems="center">
                <Text textStyle="md">{t("Rewards Pool")}</Text>
                <Tooltip content={<Text>{t("Amount of B3TR available for rewards distribution")}</Text>}>
                  <Icon as={FiInfo} color="icon.default" position={"relative"} />
                </Tooltip>
              </HStack>
              <Skeleton loading={isRewardsBalanceLoading}>
                <Heading size={{ base: "2xl", md: "4xl" }} color={rewardsPoolColor}>
                  {compactFormatter.format(Number(rewardsBalance?.scaled || 0))}
                </Heading>
              </Skeleton>
            </VStack>
            <VStack alignItems={"flex-end"} gap={0}>
              <Button
                mt={1}
                colorPalette={isPaused ? "red" : undefined}
                disabled={!isAppAdmin}
                onClick={onOpenManagementCenter}
                variant={isPaused ? "solid" : "primary"}
                w={"full"}>
                {isPaused ? t("Resume") : t("Manage")}
              </Button>
            </VStack>
          </Stack>
          <Box position="relative" my={2} pt={3} mx="-24px" width="calc(100% + 48px)">
            <Separator borderColor="border.primary" />
          </Box>
          <Link
            textStyle="md"
            fontWeight="semibold"
            color="actions.secondary.text-lighter"
            onClick={onOpenRewardsPoolAccess}
            alignSelf={"start"}>
            {t("History")}
          </Link>
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
          <TransferAppFundsModal
            app={app}
            isOpen={isOpenDepositOrWithdraw}
            onClose={onCloseDepositOrWithdraw}
            isEnablingRewardsPool={!isRewardsPoolEnabled}
            isPaused={isPaused}
            isAppAdmin={isAppAdmin}
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

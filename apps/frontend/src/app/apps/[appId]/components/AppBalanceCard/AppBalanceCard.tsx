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
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import {
  useAppAvailableFunds,
  useAppRewardsBalance,
  useIsRewardsPoolEnabled,
  useIsDistributionPaused,
} from "@/api/contracts/x2EarnRewardsPool"
import { useIsAppAdmin } from "@/api"

// Modal components
import { AppBalanceTxsHistory } from "./AppBalanceTxsHistory"
import { TransferAppFundsModal } from "./TransferAppFundsModal"
import { ManagementCenterModal } from "./ManagementCenterModal"

import { Tooltip } from "@/components/ui/tooltip"
import { FiInfo } from "react-icons/fi"
import { useMemo } from "react"
import { FaArrowUpRightFromSquare } from "react-icons/fa6"
import { useWallet } from "@vechain/vechain-kit"
import { GenericAlert } from "@/app/components/Alert"
const compactFormatter = getCompactFormatter(4)

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
    if (isPaused) return "#FCEEF1"
    if (isRewardsPoolEnabled) return "#3DBA67"
    else return "#D9D9D9"
  }, [isPaused, isRewardsPoolEnabled])

  return (
    <>
      <Card.Root
        w={"full"}
        border={isPaused ? "1px solid #C84968" : "1px solid #D5D5D5"}
        boxShadow={isPaused ? "0 0 8px rgba(245, 101, 101, 0.5)" : "none"}>
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
                  <span>
                    <Icon as={FiInfo} color="logo" position={"relative"} />
                  </span>
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
            <Separator borderColor="#E2E8F0" />
          </Box>

          <Stack direction="row" w="full" justifyContent={"space-between"} alignItems="center" pt={2}>
            <VStack alignItems={"start"} gap={0}>
              <HStack>
                <Text textStyle="md">{t("Rewards Pool")}</Text>
                <Tooltip content={<Text>{t("Amount of B3TR available for rewards distribution")}</Text>}>
                  <span>
                    <Icon as={FiInfo} color="logo" position={"relative"} />
                  </span>
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
                disabled={!isAppAdmin}
                onClick={onOpenManagementCenter}
                variant={isPaused ? "dangerFilledTonal" : "primaryAction"}
                color={isPaused ? "#C84968" : "white"}
                borderRadius={"full"}
                w={"full"}>
                {isPaused ? t("Resume") : t("Manage")}
              </Button>
            </VStack>
          </Stack>
          <Box position="relative" my={2} pt={3} mx="-24px" width="calc(100% + 48px)">
            <Separator borderColor="#E2E8F0" />
          </Box>
          <HStack onClick={onOpenRewardsPoolAccess} cursor="pointer" alignSelf={"start"}>
            <Text textStyle="md" fontWeight="semibold" color="brand.primary">
              {t("View history")}
            </Text>
            <Icon as={FaArrowUpRightFromSquare} boxSize="12px" color="#004CFC" cursor="pointer" />
          </HStack>
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

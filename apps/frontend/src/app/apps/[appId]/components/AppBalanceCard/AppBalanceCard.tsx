import {
  Button,
  Card,
  CardBody,
  Divider,
  HStack,
  Stack,
  Heading,
  Skeleton,
  Text,
  Icon,
  VStack,
  useDisclosure,
  Box,
  Center,
  Flex,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useAppBalance, useAppRewardsBalance, useIsRewardsPoolEnabled } from "@/api/contracts/x2EarnRewardsPool"
import { WithdrawModal } from "./WithdrawModal"
import { DepositModal } from "./DepositModal"
import { FundsManagementModal } from "./FundsManagementModal"
import { RewardsPoolDetailsModal } from "./RewardsPoolDetailsModal"
import { BaseTooltip } from "@/components"
import { FiInfo } from "react-icons/fi"
import { useWallet } from "@vechain/dapp-kit-react"
import { useAccountAppPermissions } from "@/api"
import { useMemo, useState, useEffect, useRef } from "react"
import { HiMiniArrowsUpDown } from "react-icons/hi2"
import { FaChevronRight } from "react-icons/fa6"
import { BalanceWarnings, WarningType } from "./components/BalanceWarnings"

const compactFormatter = getCompactFormatter(4)
export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { isOpen: isOpenWithdraw, onOpen: onOpenWithdraw, onClose: onCloseWithdraw } = useDisclosure()
  const { isOpen: isOpenDeposit, onOpen: onOpenDeposit, onClose: onCloseDeposit } = useDisclosure()
  const {
    isOpen: isOpenFundsManagement,
    onOpen: onOpenFundsManagement,
    onClose: onCloseFundsManagement,
  } = useDisclosure()
  const {
    isOpen: isOpenRewardsPoolAccess,
    onOpen: onOpenRewardsPoolAccess,
    onClose: onCloseRewardsPoolAccess,
  } = useDisclosure()
  const { app } = useCurrentAppInfo()
  const { data: balance, isLoading: isBalanceLoading } = useAppBalance(app?.id ?? "")
  const { data: rewardsBalance, isLoading: isRewardsBalanceLoading } = useAppRewardsBalance(app?.id ?? "")
  const { account } = useWallet()

  const { data: appPermissions } = useAccountAppPermissions(account ?? "")

  const isAppAdmin = useMemo(() => {
    if (!appPermissions || !app) return false
    return appPermissions[app.id]?.isAdmin
  }, [appPermissions, app])

  const [isExpanded, setIsExpanded] = useState(false)

  const { data: isRewardsPoolEnabled } = useIsRewardsPoolEnabled(app?.id ?? "")
  const [isEnabled, setIsEnabled] = useState(isRewardsPoolEnabled ?? false)

  const prevStateOnChain = useRef(isRewardsPoolEnabled)
  useEffect(() => {
    if (isRewardsPoolEnabled !== undefined && isRewardsPoolEnabled !== prevStateOnChain.current) {
      prevStateOnChain.current = isRewardsPoolEnabled
      setIsEnabled(isRewardsPoolEnabled)
    }
  }, [isRewardsPoolEnabled])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
    onOpenFundsManagement()
  }

  const runningLow = useMemo(() => {
    return rewardsBalance && 0 < Number(rewardsBalance.scaled) && Number(rewardsBalance.scaled) < 100
  }, [rewardsBalance])

  const runningOut = useMemo(() => {
    return rewardsBalance && Number(rewardsBalance.scaled) === 0
  }, [rewardsBalance])

  const warningType = useMemo<WarningType | null>(() => {
    if (runningOut) return "OUT"
    if (runningLow) return "LOW"
    return null
  }, [runningOut, runningLow])

  return (
    <>
      <Card w={"full"} variant="baseWithBorder">
        <CardBody pt={3}>
          <HStack justify={"space-between"} w={"full"}>
            <VStack alignItems={"start"}>
              <HStack>
                <Heading size="md">{t("Balances")}</Heading>
                <BaseTooltip
                  text={t(
                    "Total amount of B3TR tokens that the app has available for rewards distribution and withdrawal.",
                  )}>
                  <span>
                    <Icon as={FiInfo} color="rgba(0, 76, 252, 1)" position={"relative"} />
                  </span>
                </BaseTooltip>
              </HStack>
              <Skeleton isLoaded={!isBalanceLoading}>
                <Heading size={{ base: "2xl", md: "xl" }}>{compactFormatter.format(Number(balance?.scaled))}</Heading>
              </Skeleton>
            </VStack>

            <VStack spacing={2}>
              {isAppAdmin && (
                <Button
                  mt={1}
                  isDisabled={balance?.scaled === "0.0" || !balance || isBalanceLoading}
                  onClick={onOpenWithdraw}
                  variant={"primaryAction"}
                  borderRadius={"full"}
                  w={"full"}>
                  {t("Withdraw")}
                </Button>
              )}
              <Button mt={1} onClick={onOpenDeposit} variant={"primarySubtle"} borderRadius={"full"} w={"full"}>
                {t("Deposit")}
              </Button>
            </VStack>
          </HStack>
          {/* Manage App Funds Section*/}
          <Box position="relative" my={2} pt={6} mx="-24px" width="calc(100% + 48px)">
            <Divider borderColor="#E2E8F0" />
            {isEnabled && (
              <Center
                position="absolute"
                left="24px"
                transform="translateY(-50%)"
                onClick={toggleExpand}
                cursor="pointer"
                zIndex={1}>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="white"
                  border="1px solid #E2E8F0"
                  boxShadow="sm"
                  justifyContent="center"
                  alignItems="center"
                  _hover={{ bg: "#F7FAFC" }}>
                  <Icon
                    as={HiMiniArrowsUpDown}
                    boxSize="18px"
                    transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"}
                    transition="transform 0.3s ease"
                    onClick={onOpenFundsManagement}
                  />
                </Flex>
              </Center>
            )}
          </Box>

          <Stack
            direction="row"
            w="full"
            justifyContent={isEnabled ? "space-between" : "flex-start"}
            alignItems="center"
            pt={4}
            pb={isEnabled ? "10px" : "0px"}
            mt={2}>
            {isEnabled && (
              <VStack alignItems={"start"}>
                <HStack>
                  <Heading size="md">{t("Rewards Pool")}</Heading>
                  <BaseTooltip text={t("Amount of B3TR available for rewards distribution")}>
                    <span>
                      <Icon as={FiInfo} color="rgba(0, 76, 252, 1)" position={"relative"} />
                    </span>
                  </BaseTooltip>
                </HStack>
                <Skeleton isLoaded={!isRewardsBalanceLoading}>
                  <Heading size={{ base: "2xl", md: "xl" }}>
                    {compactFormatter.format(Number(rewardsBalance?.scaled))}
                  </Heading>
                </Skeleton>
              </VStack>
            )}
            <HStack onClick={onOpenRewardsPoolAccess} cursor="pointer" alignSelf={"start"}>
              <Text fontSize="md" fontWeight={500} color="#004CFC">
                {isEnabled ? t("Manage") : t("Enable Allowance")}
              </Text>
              <Icon as={FaChevronRight} boxSize="12px" color="#004CFC" cursor="pointer" />
            </HStack>
          </Stack>
          {isEnabled && warningType && <BalanceWarnings type={warningType} />}
        </CardBody>
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
          <RewardsPoolDetailsModal
            appId={app.id}
            isOpen={isOpenRewardsPoolAccess}
            isEnabled={isEnabled}
            setIsEnabled={setIsEnabled}
            onClose={onCloseRewardsPoolAccess}
          />
          <FundsManagementModal appId={app.id} isOpen={isOpenFundsManagement} onClose={onCloseFundsManagement} />
        </>
      )}
    </>
  )
}

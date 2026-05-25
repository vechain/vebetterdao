import {
  Button,
  Heading,
  Image,
  Skeleton,
  useDisclosure,
  Card,
  Stat,
  Icon,
  GridItem,
  Grid,
  Text,
} from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import React from "react"
import { useTranslation } from "react-i18next"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { SnapshotExplanationModal } from "@/app/components/Countdown/SnapshotExplanationModal"

import { ConvertB3trAndVot3Modal } from "../../../app/components/ConvertB3trAndVot3Modal"
import { CountdownVoting } from "../../../app/components/Countdown/CountdownVoting"
import { useRetrieveProfilIdentity } from "../../../app/profile/components/utils/useRetrieveProfilIdentity"
import { useDomainOrAddress } from "../../../hooks/useDomainOrAddress"
import { useGetB3trBalance } from "../../../hooks/useGetB3trBalance"
import { useGetVot3UnlockedBalance } from "../../../hooks/useGetVot3UnlockedBalance"
import { B3TRIcon } from "../../Icons/B3TRIcon"

const compactFormatter = getCompactFormatter(4)
export const SwapB3trVot3 = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(address)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useGetVot3UnlockedBalance(address)
  const { data: delegatedAmount, isLoading: isDelegatedLoading } = useGetDelegatedAmount(address)
  const { data: isNavigator } = useIsNavigator(address)
  const { data: stakeData, isLoading: isStakeLoading } = useGetStake(address)

  // Delegated VOT3 — citizen role: VOT3 locked under a navigator (not in `unlockedBalance`).
  const hasDelegated = !!delegatedAmount && delegatedAmount.raw > 0n
  // Staked B3TR — navigator role: B3TR converted to VOT3 inside NavigatorRegistry as collateral.
  const hasStaked = !!isNavigator && !!stakeData && stakeData.raw > 0n

  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading
  const isSwapDisabled = isLoading || hasNoBalance
  const { isConnectedUser, domain, profile, isOnProfilePage } = useRetrieveProfilIdentity()
  const domainOrAddress = useDomainOrAddress({ domain: domain ?? "", address: profile ?? "" })
  const { open: isOpenSnapshot, onOpen: onOpenSnapshot, onClose: onCloseSnapshot } = useDisclosure()
  return (
    <>
      <Grid
        flex={1}
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        templateRows={{ base: "auto", md: "auto 1fr auto" }}
        gap="4">
        <Heading size="xl" color="actions.primary.text" fontWeight="bold">
          {t("{{value}} tokens", {
            value: isConnectedUser || !isOnProfilePage ? t("Your") : domainOrAddress,
          })}
        </Heading>
        <GridItem alignSelf="center" justifySelf={{ base: "flex-start", md: "flex-end" }}>
          <CountdownVoting onOpen={onOpenSnapshot} />
        </GridItem>

        <Card.Root bg="transparency.200" border="0">
          <Card.Body>
            <Stat.Root>
              <Stat.Label color="actions.primary.text" textStyle="sm">
                {t("Available B3TR")}
              </Stat.Label>
              <Stat.ValueText flex={1} alignItems="center">
                <Icon as={B3TRIcon} boxSize={"30px"} />
                <Skeleton loading={isB3trBalanceLoading}>
                  <Heading size="3xl" color="actions.primary.text">
                    {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
                  </Heading>
                </Skeleton>
              </Stat.ValueText>
              {hasStaked && (
                <Skeleton loading={isStakeLoading}>
                  <Text textStyle="xs" color="actions.primary.text" opacity={0.7} mt={1}>
                    {t("+ {{amount}} staked as navigator", {
                      amount: compactFormatter.format(Number(stakeData?.scaled ?? "0")),
                    })}
                  </Text>
                </Skeleton>
              )}
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        <Card.Root bg="transparency.200" border="0">
          <Card.Body>
            <Stat.Root>
              <Stat.Label color="actions.primary.text" textStyle="sm">
                {t("Available VOT3")}
              </Stat.Label>
              <Stat.ValueText flex={1} alignItems="center">
                <Image src={"/assets/logos/vot3_logo_dark.svg"} boxSize={"30px"} alt="VOT3 Icon" />
                <Skeleton loading={isVot3BalanceLoading}>
                  <Heading size="3xl" color="actions.primary.text">
                    {compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}
                  </Heading>
                </Skeleton>
              </Stat.ValueText>
              {hasDelegated && (
                <Skeleton loading={isDelegatedLoading}>
                  <Text textStyle="xs" color="actions.primary.text" opacity={0.7} mt={1}>
                    {t("+ {{amount}} delegated to navigator", {
                      amount: compactFormatter.format(Number(delegatedAmount?.scaled ?? "0")),
                    })}
                  </Text>
                </Skeleton>
              )}
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        <GridItem colSpan={{ base: 1, md: 2 }}>
          {(isConnectedUser || !isOnProfilePage) && (
            <Button
              w="full"
              disabled={isSwapDisabled}
              onClick={onOpen}
              variant="secondary"
              rounded={"full"}
              fontWeight="semibold"
              px="6">
              <UilExchangeAlt
                size={"16px"}
                style={{
                  transform: "rotate(90deg)",
                }}
              />
              {t("Convert tokens")}
            </Button>
          )}
        </GridItem>
      </Grid>
      <SnapshotExplanationModal isOpen={isOpenSnapshot} onClose={onCloseSnapshot} />
      <ConvertB3trAndVot3Modal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

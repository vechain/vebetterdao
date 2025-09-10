import { ConvertModal } from "@/components/Convert/components/Modal/ConvertModal"
import { B3TRIcon } from "@/components/Icons"
import {
  Button,
  Heading,
  Image,
  Skeleton,
  useDisclosure,
  SimpleGrid,
  Card,
  Stat,
  Icon,
  GridItem,
} from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import React from "react"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
import { CountdownVoting } from "@/app/components/Countdown"
import { SnapshotExplainationModal } from "@/app/components/Countdown/SnapshotExplainationModal"
import { useDomainOrAddress, useGetB3trBalance, useGetVot3Balance } from "@/hooks"

const compactFormatter = getCompactFormatter(4)

export const SwapB3trVot3 = ({ address }: { address: string }) => {
  const { t } = useTranslation()

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useGetB3trBalance(address)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useGetVot3Balance(address)

  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading

  const isSwapDisabled = isLoading || hasNoBalance

  const { isConnectedUser, domain, profile, isOnProfilePage } = useRetrieveProfilIdentity()
  const domainOrAddress = useDomainOrAddress({ domain: domain ?? "", address: profile ?? "" })

  const { open: isOpenSnapshot, onOpen: onOpenSnapshot, onClose: onCloseSnapshot } = useDisclosure()

  return (
    <>
      <SimpleGrid columns={{ base: 1, md: 2 }} alignItems="center" justifyItems="space-between" gap="4">
        <Heading textStyle="xl" color="actions.primary.text" fontWeight="bold">
          {t("{{value}} tokens", {
            value: isConnectedUser || !isOnProfilePage ? t("Your") : domainOrAddress,
          })}
        </Heading>
        <GridItem justifySelf={{ base: "flex-start", md: "flex-end" }}>
          <CountdownVoting onOpen={onOpenSnapshot} />
        </GridItem>
        <Card.Root bg="transparency.200">
          <Card.Body>
            <Stat.Root>
              <Stat.Label color="actions.primary.text" textStyle="sm">
                {t("Total B3TR Balance")}
              </Stat.Label>
              <Stat.ValueText alignItems="center">
                <Icon as={B3TRIcon} boxSize={"30px"} />
                <Skeleton loading={isB3trBalanceLoading}>
                  <Heading size="3xl" color="actions.primary.text">
                    {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
                  </Heading>
                </Skeleton>
              </Stat.ValueText>
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        <Card.Root bg="transparency.200">
          <Card.Body>
            <Stat.Root>
              <Stat.Label color="actions.primary.text" textStyle="sm">
                {t("Total VOT3 Balance")}
              </Stat.Label>
              <Stat.ValueText alignItems="center">
                <Image src={"/assets/logos/vot3_logo_dark.svg"} boxSize={"30px"} alt="VOT3 Icon" />
                <Skeleton loading={isB3trBalanceLoading}>
                  <Heading size="3xl" color="actions.primary.text">
                    {compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}
                  </Heading>
                </Skeleton>
              </Stat.ValueText>
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        <GridItem colSpan={{ base: 1, md: 2 }}>
          {(isConnectedUser || !isOnProfilePage) && (
            <Button
              w="full"
              disabled={isSwapDisabled}
              onClick={onOpen}
              mt="auto"
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
      </SimpleGrid>
      <SnapshotExplainationModal isOpen={isOpenSnapshot} onClose={onCloseSnapshot} />
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

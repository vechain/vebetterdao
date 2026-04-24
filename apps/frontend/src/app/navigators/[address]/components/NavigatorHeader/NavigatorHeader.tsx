import { Badge, Button, Card, Heading, HStack, Link, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuExternalLink, LuShare2 } from "react-icons/lu"

import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { type NavigatorStatusValue } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { NavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { AddressIcon } from "@/components/AddressIcon"

import { NavigatorAboutSection } from "./NavigatorAboutSection"
import { NavigatorHeaderMenu } from "./NavigatorHeaderMenu"
import { NavigatorShareModal } from "./NavigatorShareModal"

type MainAction = "manage-delegation" | "manage-stake" | "withdraw-stake" | "delegate" | "share"

type Props = {
  address: string
  displayName: string
  domainLoading: boolean
  metadata: NavigatorMetadata | undefined
  metadataLoading: boolean
  registeredAt: number
  status: NavigatorStatusValue
  isDelegatedHere: boolean
  isConnected: boolean
  isOwnPage: boolean
  hasStake: boolean
  isAtCapacity: boolean
  onDelegationClick: () => void
  onManageStakeClick: () => void
  onWithdrawStakeClick: () => void
  onExitDelegation: () => void
  onEditProfile: () => void
  onAnnounceExit: () => void
}

type MainActionInput = {
  status: NavigatorStatusValue
  isDelegatedHere: boolean
  isOwnPage: boolean
  isConnected: boolean
  hasStake: boolean
  isNavigator: boolean
}

const getMainAction = (input: MainActionInput): MainAction => {
  if (input.isOwnPage && input.status === "DEACTIVATED" && input.hasStake) return "withdraw-stake"
  if (input.isDelegatedHere) return "manage-delegation"
  if (input.isOwnPage && input.status === "ACTIVE") return "manage-stake"
  if (input.isConnected && input.status === "ACTIVE" && !input.isNavigator) return "delegate"
  return "share"
}

export const NavigatorHeader = ({
  address,
  displayName,
  domainLoading,
  metadata,
  metadataLoading,
  registeredAt,
  status,
  isDelegatedHere,
  isConnected,
  isOwnPage,
  hasStake,
  isAtCapacity,
  onDelegationClick,
  onManageStakeClick,
  onWithdrawStakeClick,
  onExitDelegation,
  onEditProfile,
  onAnnounceExit,
}: Props) => {
  const { t } = useTranslation()
  const [isShareOpen, setIsShareOpen] = useState(false)
  const { data: isNavigator } = useIsNavigator()

  const mainAction = getMainAction({
    status,
    isDelegatedHere,
    isOwnPage,
    isConnected,
    hasStake,
    isNavigator: !!isNavigator,
  })
  const handleShare = () => setIsShareOpen(true)

  const mainButtonConfig: Record<MainAction, { label: string; onClick: () => void; variant: "primary" | "secondary" }> =
    {
      "manage-delegation": { label: t("Manage Delegation"), onClick: onDelegationClick, variant: "primary" },
      "manage-stake": { label: t("Manage Stake"), onClick: onManageStakeClick, variant: "primary" },
      "withdraw-stake": { label: t("Withdraw Stake"), onClick: onWithdrawStakeClick, variant: "primary" },
      delegate: { label: t("Delegate"), onClick: onDelegationClick, variant: "primary" },
      share: { label: t("Share"), onClick: handleShare, variant: "secondary" },
    }

  const { label, onClick, variant } = mainButtonConfig[mainAction]

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <HStack gap={4} align="center" flexWrap="wrap">
            <AddressIcon address={address} boxSize={12} borderRadius="full" />
            <Skeleton loading={domainLoading}>
              <HStack gap={2} align="center">
                <Heading size={{ base: "md", md: "lg" }}>{displayName}</Heading>
                {status !== "ACTIVE" && status !== "NONE" && (
                  <Badge colorPalette={status === "EXITING" ? "yellow" : "red"} size="sm">
                    {status}
                  </Badge>
                )}
              </HStack>
            </Skeleton>

            <HStack flex={1} w={{ base: "full", md: "auto" }} justify="end" gap={2}>
              {isConnected && (
                <Button
                  variant={variant}
                  size="sm"
                  flex={{ base: 1, md: "initial" }}
                  onClick={onClick}
                  disabled={mainAction === "delegate" && isAtCapacity}>
                  {mainAction === "share" && <LuShare2 />}
                  {label}
                </Button>
              )}
              <NavigatorHeaderMenu
                address={address}
                isDelegatedHere={isDelegatedHere}
                isOwnPage={isOwnPage}
                status={status}
                onExitDelegation={onExitDelegation}
                onShareClick={handleShare}
                onEditProfile={onEditProfile}
                onAnnounceExit={onAnnounceExit}
              />
            </HStack>
          </HStack>

          <Skeleton loading={metadataLoading}>
            <Text textStyle="sm" color="fg.muted">
              {metadata?.votingStrategy || t("No voting strategy provided")}
            </Text>
          </Skeleton>

          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            {metadata?.socials && (
              <HStack gap={3}>
                {metadata.socials.twitter && (
                  <Link
                    href={`https://x.com/${metadata.socials.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="plain">
                    <HStack gap={1}>
                      <Text textStyle="xs" color="fg.muted">
                        {"@"}
                        {metadata.socials.twitter}
                      </Text>
                      <LuExternalLink size={10} />
                    </HStack>
                  </Link>
                )}
                {metadata.socials.website && (
                  <Link
                    href={
                      metadata.socials.website.startsWith("http")
                        ? metadata.socials.website
                        : `https://${metadata.socials.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="plain">
                    <HStack gap={1}>
                      <Text textStyle="xs" color="fg.muted">
                        {metadata.socials.website}
                      </Text>
                      <LuExternalLink size={10} />
                    </HStack>
                  </Link>
                )}
              </HStack>
            )}
          </HStack>

          <NavigatorAboutSection metadata={metadata} metadataLoading={metadataLoading} registeredAt={registeredAt} />
        </VStack>
      </Card.Body>

      <NavigatorShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} displayName={displayName} />
    </Card.Root>
  )
}

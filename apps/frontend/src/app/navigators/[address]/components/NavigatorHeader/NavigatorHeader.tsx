import { Button, Card, Heading, HStack, Link, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuExternalLink, LuShare2 } from "react-icons/lu"

import { NavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { AddressIcon } from "@/components/AddressIcon"

import { NavigatorAboutSection } from "./NavigatorAboutSection"
import { NavigatorHeaderMenu } from "./NavigatorHeaderMenu"
import { NavigatorShareModal } from "./NavigatorShareModal"

type MainAction = "manage-delegation" | "manage-stake" | "delegate" | "share"

type Props = {
  address: string
  displayName: string
  domainLoading: boolean
  bio: string | undefined
  metadata: NavigatorMetadata | undefined
  metadataLoading: boolean
  isActive: boolean
  isDelegatedHere: boolean
  isConnected: boolean
  isNavigator: boolean
  isOwnPage: boolean
  onDelegationClick: () => void
  onManageStakeClick: () => void
  onExitDelegation: () => void
}

const getMainAction = (
  isDelegatedHere: boolean,
  isNavigator: boolean,
  isOwnPage: boolean,
  isConnected: boolean,
  isActive: boolean,
): MainAction => {
  if (isDelegatedHere) return "manage-delegation"
  if (isNavigator && isOwnPage) return "manage-stake"
  if (isConnected && !isNavigator && isActive) return "delegate"
  return "share"
}

export const NavigatorHeader = ({
  address,
  displayName,
  domainLoading,
  bio,
  metadata,
  metadataLoading,
  isActive,
  isDelegatedHere,
  isConnected,
  isNavigator,
  isOwnPage,
  onDelegationClick,
  onManageStakeClick,
  onExitDelegation,
}: Props) => {
  const { t } = useTranslation()
  const [isShareOpen, setIsShareOpen] = useState(false)

  const mainAction = getMainAction(isDelegatedHere, isNavigator, isOwnPage, isConnected, isActive)
  const showMenu = mainAction !== "share"

  const handleShare = () => setIsShareOpen(true)

  const mainButtonConfig: Record<MainAction, { label: string; onClick: () => void; variant: "primary" | "secondary" }> =
    {
      "manage-delegation": { label: t("Manage Delegation"), onClick: onDelegationClick, variant: "secondary" },
      "manage-stake": { label: t("Manage Stake"), onClick: onManageStakeClick, variant: "secondary" },
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
              <Heading size={{ base: "md", md: "lg" }}>{displayName}</Heading>
            </Skeleton>

            <HStack flex={1} justify="end" gap={2}>
              <Button variant={variant} size="sm" onClick={onClick}>
                {mainAction === "share" && <LuShare2 />}
                {label}
              </Button>
              {showMenu && (
                <NavigatorHeaderMenu
                  isDelegatedHere={isDelegatedHere}
                  onExitDelegation={onExitDelegation}
                  onShareClick={handleShare}
                />
              )}
            </HStack>
          </HStack>

          <Text textStyle="sm" color="fg.muted">
            {bio || t("No bio provided")}
          </Text>

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

          <NavigatorAboutSection metadata={metadata} metadataLoading={metadataLoading} />
        </VStack>
      </Card.Body>

      <NavigatorShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} displayName={displayName} />
    </Card.Root>
  )
}

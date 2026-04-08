import { Button, Card, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuExternalLink } from "react-icons/lu"

import { NavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { AddressIcon } from "@/components/AddressIcon"

import { NavigatorAboutSection } from "./NavigatorAboutSection"

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
  onDelegateClick: () => void
  onManageClick: () => void
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
  onDelegateClick,
  onManageClick,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <HStack gap={4} align="center" flexWrap="wrap">
            <AddressIcon address={address} boxSize={12} borderRadius="full" />
            <Skeleton loading={domainLoading}>
              <Heading size={{ base: "md", md: "lg" }}>{displayName}</Heading>
            </Skeleton>

            <HStack flex={1} justify="end">
              {isConnected && isDelegatedHere && (
                <Button variant="secondary" size="sm" onClick={onManageClick}>
                  {t("Manage Delegation")}
                </Button>
              )}
              {isConnected && isActive && !isDelegatedHere && (
                <Button variant="primary" size="sm" onClick={onDelegateClick}>
                  {t("Delegate")}
                </Button>
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
                  <HStack gap={1} cursor="pointer" _hover={{ textDecoration: "underline" }}>
                    <Text textStyle="xs" color="fg.muted">
                      {"@"}
                      {metadata.socials.twitter}
                    </Text>
                    <LuExternalLink size={10} />
                  </HStack>
                )}
                {metadata.socials.website && (
                  <HStack gap={1} cursor="pointer" _hover={{ textDecoration: "underline" }}>
                    <Text textStyle="xs" color="fg.muted">
                      {metadata.socials.website}
                    </Text>
                    <LuExternalLink size={10} />
                  </HStack>
                )}
              </HStack>
            )}
          </HStack>

          <NavigatorAboutSection metadata={metadata} metadataLoading={metadataLoading} />
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

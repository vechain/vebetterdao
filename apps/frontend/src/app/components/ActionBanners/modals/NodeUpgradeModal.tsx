import { VStack, Text, Link, HStack, Button } from "@chakra-ui/react"
import Image from "next/image"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import { STARGATE_APP_URL } from "@/constants/links"

import { setBannerEnabled, BannerStorageKey } from "../../Banners/GenericBanner"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const NodeUpgradeModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      showCloseButton={true}
      modalContentProps={{ rounded: "xl", maxW: "lg" }}>
      <VStack gap={6} w="full">
        <VStack gap={2} textAlign="center">
          <Image src="/assets/3d-illustrations/node.webp" alt="Illustration 3d Fist" width="80" height="80" />
          <Text textStyle="xl" fontWeight="bold">
            {t("Migrate your Node NFT before December 2")}
          </Text>
        </VStack>

        <Text textStyle="sm" textAlign="center">
          {t("You still hold an outdated NFT. Migrate before December 2 to avoid losing your endorsement capability.")}
        </Text>

        <HStack gap={4} w="full">
          <Button
            flex={1}
            variant="secondary"
            onClick={() => {
              setBannerEnabled(BannerStorageKey.STARGATE_MIGRATION)
              onClose()
            }}>
            {t("Later")}
          </Button>
          <Button flex={1} asChild variant="primary">
            <Link href={STARGATE_APP_URL} target="_blank" rel="noopener noreferrer">
              {t("Migrate now")}
            </Link>
          </Button>
        </HStack>
      </VStack>
    </BaseModal>
  )
}

import { Card, Icon, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { EmptyStateCard } from "@/components/EmptyStateCard"
import { GmActionButton } from "@/components/GmActionButton"
import NFTEarthIcon from "@/components/Icons/svg/nft-earth.svg"

export const GmNoNFTEmptyState = () => {
  const { t } = useTranslation()

  return (
    <VStack align="stretch" flex="1" gap="4">
      <Card.Root variant="primary">
        <Card.Body>
          <EmptyStateCard
            icon={
              <Icon boxSize={100} color="bg.inverted">
                <NFTEarthIcon />
              </Icon>
            }
            title={t("You don't own a GM NFT yet")}
            description={t(
              "Galaxy Member NFTs unlock extra features and boost your rewards. Vote in an allocation round to become eligible for a free mint.",
            )}
          />
          <VStack align="center" pt={4}>
            <GmActionButton
              buttonProps={{
                variant: "primary",
                size: "lg",
                w: "fit-content",
                px: 8,
              }}
            />
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}

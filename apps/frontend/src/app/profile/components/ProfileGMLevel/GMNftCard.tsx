import { Box, Button, Card, Image, LinkBox, LinkOverlay, Text, HStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa"

import { UserGM } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { ConditionalWrapper } from "@/components/ConditionalWrapper"
import { useSelectGM } from "@/hooks/useSelectGM"
import { useCallback } from "react"
import { useBreakpoints } from "@/hooks"

export const GMNftCard = ({ gm, isClickable }: { gm?: UserGM; isClickable: boolean }) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const selectGMMutation = useSelectGM({ tokenId: gm?.tokenId })

  const handleSelectGM = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      selectGMMutation.sendTransaction()
    },
    [selectGMMutation],
  )

  return (
    <LinkBox flex={1}>
      <Card.Root
        variant={gm?.isSelected ? "primaryBoxShadow" : "outline"}
        alignItems="center"
        flexDirection="row"
        gap="8px"
        p="16px"
        rounded="8px"
        borderStyle={gm ? "solid" : "dashed"}
        _dark={{
          border: gm ? "none" : "1px dashed #FFFFFF33",
        }}>
        <Card.Header p="0">
          <Image src={gm?.metadata?.image} alt={gm?.metadata?.name} boxSize="62px" rounded="8px" />
        </Card.Header>

        <Card.Body p="0" gap="0">
          {gm ? (
            <>
              <ConditionalWrapper
                condition={isClickable}
                wrapper={({ children }) => (
                  <LinkOverlay href={`/galaxy-member/${gm?.tokenId}`} as={NextLink}>
                    {children}
                  </LinkOverlay>
                )}>
                <Text textStyle="sm" _dark={{ color: "#FFFFFFB2" }}>
                  {t("NFT")}
                </Text>
              </ConditionalWrapper>

              <Text fontWeight="bold" lineHeight={1.6} lineClamp={1}>
                {gm?.metadata?.name}
              </Text>

              <Box
                w="fit-content"
                display="inline-block"
                bg="#F8F8F8"
                _dark={{ bg: "#FFFFFF4A" }}
                rounded="8px"
                padding="4px 8px">
                <Text textStyle={"xs"} lineClamp={1}>
                  {t("{{value}}x reward weight", { value: gm.multiplier || 0 })}
                </Text>
              </Box>
            </>
          ) : (
            <Text textStyle="sm" _dark={{ color: "#FFFFFFB2" }}>
              {t("No NFT attached")}
            </Text>
          )}
        </Card.Body>

        {isClickable && (
          <Card.Footer p="0">
            <HStack gap="4" w="full" justifyContent={!isMobile ? "flex-start" : "center"}>
              <Button variant="primarySubtle" w="7rem" disabled={gm?.isSelected} onClick={handleSelectGM}>
                {t(gm?.isSelected ? "Active" : "Activate")}
              </Button>

              {!isMobile && <FaChevronRight />}
            </HStack>
          </Card.Footer>
        )}
      </Card.Root>
    </LinkBox>
  )
}

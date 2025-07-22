import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  LinkBox,
  LinkOverlay,
  Text,
  useMediaQuery,
  HStack,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa"

import { UserGM } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { ConditionalWrapper } from "@/components/ConditionalWrapper"
import { useSelectGM } from "@/hooks/useSelectGM"
import { useCallback } from "react"

export const GMNftCard = ({ gm, isClickable }: { gm?: UserGM; isClickable: boolean }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")
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
      <Card
        variant={gm?.isSelected ? "primaryBoxShadow" : "outline"}
        alignItems={isAbove800 ? "center" : "flex-start"}
        direction={isAbove800 ? "row" : "column"}
        gap="8px"
        p="16px"
        rounded="8px"
        borderStyle={gm ? "solid" : "dashed"}
        _dark={{
          border: gm ? "none" : "1px dashed #FFFFFF33",
        }}>
        <CardHeader p="0">
          <Image
            src={gm?.metadata?.image}
            fallbackSrc="/assets/icons/not-found-image-fallback.svg"
            alt={gm?.metadata?.name}
            boxSize="62px"
            rounded="8px"
          />
        </CardHeader>

        <CardBody p="0" gap="8px">
          {gm ? (
            <>
              <ConditionalWrapper
                condition={isClickable}
                wrapper={({ children }) => (
                  <LinkOverlay href={`/galaxy-member/${gm?.tokenId}`} as={NextLink}>
                    {children}
                  </LinkOverlay>
                )}>
                <Text fontSize="sm" lineHeight={1} _dark={{ color: "#FFFFFFB2" }}>
                  {t("NFT")}
                </Text>
              </ConditionalWrapper>

              <Text fontWeight={700} lineHeight={1.6} noOfLines={1}>
                {gm?.metadata?.name}
              </Text>

              <Box display="inline-block" bg="#F8F8F8" _dark={{ bg: "#FFFFFF4A" }} rounded="8px" padding="4px 8px">
                <Text fontSize={"xs"} fontWeight={400} noOfLines={1}>
                  {t("{{value}}x reward weight", { value: gm.multiplier || 0 })}
                </Text>
              </Box>
            </>
          ) : (
            <Text fontSize="sm" _dark={{ color: "#FFFFFFB2" }}>
              {t("No NFT attached")}
            </Text>
          )}
        </CardBody>

        {isClickable && (
          <CardFooter>
            <HStack spacing="4">
              <Button variant="primarySubtle" w="7rem" isDisabled={gm?.isSelected} onClick={handleSelectGM}>
                {t(gm?.isSelected ? "Active" : "Activate")}
              </Button>

              <FaChevronRight />
            </HStack>
          </CardFooter>
        )}
      </Card>
    </LinkBox>
  )
}

import NextLink from "next/link"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
  useMediaQuery,
} from "@chakra-ui/react"

import { UserGM } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { useTranslation } from "react-i18next"

export const ProfileGMListItem = ({ gm, node }: { gm?: UserGM; node?: UserNode }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  return (
    <Stack gap="2" direction={"row"} align="center" justify="stretch">
      <LinkBox flex={1}>
        <Card
          variant="outline"
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
                <LinkOverlay href={`/galaxy-member/${gm?.tokenId}`} as={NextLink}>
                  <Text fontSize="sm" lineHeight={1} _dark={{ color: "#FFFFFFB2" }}>
                    {t("NFT")}
                  </Text>
                </LinkOverlay>

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
        </Card>
      </LinkBox>

      <Image src="/assets/icons/arrow-connection.svg" boxSize={"24px"} color="#757575" alt="arrow connection" />

      <LinkBox flex={1}>
        <Card
          variant="outline"
          alignItems={isAbove800 ? "center" : "flex-start"}
          direction={isAbove800 ? "row" : "column"}
          gap="8px"
          borderStyle={node ? "solid" : "dashed"}
          _dark={{
            border: node ? "none" : "1px dashed #FFFFFF33",
          }}
          p="16px"
          rounded="8px">
          <CardHeader p="0">
            <Image
              src={node?.image}
              fallbackSrc="/assets/icons/not-found-image-fallback.svg"
              alt={node?.name}
              boxSize="62px"
              rounded="8px"
            />
          </CardHeader>

          <CardBody p="0" gap="8px">
            {node ? (
              <>
                <LinkOverlay href={`/xnode/${node.nodeId}`} as={NextLink}>
                  <Text fontSize="sm" lineHeight={1} _dark={{ color: "#FFFFFFB2" }}>
                    {t("Node")}
                  </Text>
                </LinkOverlay>

                <Text fontWeight={700} lineHeight={1.6} noOfLines={1}>
                  {`${node.name} #${node.nodeId}`}
                </Text>

                <Box display="inline-block" bg="#F8F8F8" _dark={{ bg: "#FFFFFF4A" }} rounded="8px" padding="4px 8px">
                  <Text fontSize={"xs"} fontWeight={400} noOfLines={1}>
                    {t("{{value}} points", { value: node.xNodePoints })}
                  </Text>
                </Box>
              </>
            ) : (
              <Text fontSize="sm" _dark={{ color: "#FFFFFFB2" }}>
                {t("No Node attached")}
              </Text>
            )}
          </CardBody>
        </Card>
      </LinkBox>
    </Stack>
  )
}

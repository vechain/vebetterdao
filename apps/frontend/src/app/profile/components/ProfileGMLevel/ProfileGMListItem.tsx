import NextLink from "next/link"
import { Box, Card, CardBody, CardHeader, Image, LinkBox, LinkOverlay, Stack, Text } from "@chakra-ui/react"

import { UserGM } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { useTranslation } from "react-i18next"

export const ProfileGMListItem = ({ gm, node }: { gm?: UserGM; node?: UserNode }) => {
  const { t } = useTranslation()
  return (
    <Stack gap="2" direction={"row"} align="center" justify="stretch">
      <LinkBox flex={1}>
        <Card
          alignItems="center"
          direction="row"
          gap="8px"
          border={gm ? "none" : "1px dashed #FFFFFF33"}
          bg="#FFFFFF26"
          borderColor={"#FFFFFF33"}
          p="16px"
          rounded="8px">
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
                  <Text fontSize="sm" lineHeight={1} color="#FFFFFFB2">
                    {t("NFT")}
                  </Text>
                </LinkOverlay>

                <Text fontWeight={700} lineHeight={1.6} noOfLines={1}>
                  {gm?.metadata?.name}
                </Text>

                <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                  <Text fontSize="xs" color="#FFFFFFB2" textColor="white">
                    {t("{{value}}x reward weight", { value: gm.multiplier || 0 })}
                  </Text>
                </Box>
              </>
            ) : (
              <Text fontSize="sm" color="#FFFFFFB2">
                {t("No NFT attached")}
              </Text>
            )}
          </CardBody>
        </Card>
      </LinkBox>

      <Image src="/assets/icons/arrow-connection.svg" boxSize={"24px"} color="#757575" alt="arrow connection" />

      <LinkBox flex={1}>
        <Card
          alignItems="center"
          direction="row"
          gap="8px"
          border={gm ? "none" : "1px dashed #FFFFFF33"}
          bg="#FFFFFF26"
          borderColor={"#FFFFFF33"}
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
                  <Text fontSize="sm" lineHeight={1} color="#FFFFFFB2">
                    {t("Node")}
                  </Text>
                </LinkOverlay>

                <Text fontWeight={700} lineHeight={1.6} noOfLines={1}>
                  {`${node.name} #${node.nodeId}`}
                </Text>

                <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                  <Text fontSize="xs" color="#FFFFFFB2" textColor="white">
                    {t("{{value}} points", { value: node.xNodePoints })}
                  </Text>
                </Box>
              </>
            ) : (
              <Text fontSize="sm" color="#FFFFFFB2">
                {t("No Node attached")}
              </Text>
            )}
          </CardBody>
        </Card>
      </LinkBox>
    </Stack>
  )
}

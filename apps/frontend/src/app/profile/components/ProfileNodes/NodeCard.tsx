import { Box, Card, Image, LinkBox, LinkOverlay, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { FaChevronRight } from "react-icons/fa"
import { ConditionalWrapper } from "@/components/ConditionalWrapper"
import { useBreakpoints } from "@/hooks"

export const NodeCard = ({ node, isClickable }: { node?: UserNode; isClickable: boolean }) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  return (
    <LinkBox flex={1}>
      <Card.Root
        variant="outline"
        alignItems="center"
        flexDirection="row"
        gap="8px"
        borderStyle={node ? "solid" : "dashed"}
        _dark={{
          border: node ? "none" : "1px dashed #FFFFFF33",
        }}
        p="16px"
        rounded="8px">
        <Card.Header p="0">
          <Image src={node?.image} alt={node?.name} boxSize="62px" rounded="8px" />
        </Card.Header>

        <Card.Body p="0" gap="0">
          {node ? (
            <>
              <ConditionalWrapper
                condition={isClickable}
                wrapper={({ children }) => (
                  <LinkOverlay href={`/xnode/${node.nodeId}`} as={NextLink}>
                    {children}
                  </LinkOverlay>
                )}>
                <Text textStyle="sm" _dark={{ color: "#FFFFFFB2" }}>
                  {t("Node")}
                </Text>
              </ConditionalWrapper>

              <Text fontWeight="bold" lineHeight={1.6} lineClamp={1}>
                {`${node.name} #${node.nodeId}`}
              </Text>

              <Box
                w="fit-content"
                display="inline-block"
                bg="#F8F8F8"
                _dark={{ bg: "#FFFFFF4A" }}
                rounded="8px"
                padding="4px 8px">
                <Text textStyle={"xs"} lineClamp={1}>
                  {t("{{value}} points", { value: node.xNodePoints })}
                </Text>
              </Box>
            </>
          ) : (
            <Text textStyle="sm" _dark={{ color: "#FFFFFFB2" }}>
              {t("No Node attached")}
            </Text>
          )}
        </Card.Body>

        {isClickable && !isMobile && (
          <Card.Footer p="0">
            <FaChevronRight />
          </Card.Footer>
        )}
      </Card.Root>
    </LinkBox>
  )
}

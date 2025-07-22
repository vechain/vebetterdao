import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  LinkBox,
  LinkOverlay,
  Text,
  useMediaQuery,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { FaChevronRight } from "react-icons/fa"
import { ConditionalWrapper } from "@/components/ConditionalWrapper"

export const NodeCard = ({ node, isClickable }: { node?: UserNode; isClickable: boolean }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  return (
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
              <ConditionalWrapper
                condition={isClickable}
                wrapper={({ children }) => (
                  <LinkOverlay href={`/xnode/${node.nodeId}`} as={NextLink}>
                    {children}
                  </LinkOverlay>
                )}>
                <Text fontSize="sm" lineHeight={1} _dark={{ color: "#FFFFFFB2" }}>
                  {t("Node")}
                </Text>
              </ConditionalWrapper>

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

        {isClickable && (
          <CardFooter>
            <FaChevronRight />
          </CardFooter>
        )}
      </Card>
    </LinkBox>
  )
}

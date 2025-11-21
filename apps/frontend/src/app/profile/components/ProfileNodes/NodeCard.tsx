import { Badge, Box, Button, Card, Circle, HStack, Icon, Image, LinkBox, LinkOverlay, Text } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { Lock } from "iconoir-react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa"

import { UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { ConditionalWrapper } from "@/components/ConditionalWrapper"
import { Tooltip } from "@/components/ui/tooltip"
import { STARGATE_APP_URL } from "@/constants/links"

import { useBreakpoints } from "../../../../hooks/useBreakpoints"

export const NodeCard = ({ node, isClickable }: { node: UserNode; isClickable: boolean }) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const { data: vnsData } = useVechainDomain(node?.manager)

  const managerAddressOrDomain = vnsData?.domain ? humanDomain(vnsData?.domain) : humanAddress(node?.manager)

  const isNodeDelegator = (!node?.currentUserIsManager && node?.currentUserIsOwner) ?? false

  return (
    <LinkBox flex={1}>
      <Card.Root variant="subtle" border="none" alignItems="center" flexDirection="row" gap="13px">
        <Card.Header p="0">
          <Box position="relative">
            <Image src={node?.metadata?.image} alt={node?.metadata?.name ?? ""} boxSize="62px" rounded="8px" />
            {isNodeDelegator && (
              <Tooltip
                content={t("Managed externally by {{addressOrDomain}}", { addressOrDomain: managerAddressOrDomain })}>
                <Circle
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  size="20px"
                  bg="status.info.strong"
                  borderWidth="1px"
                  borderColor="status.info.subtle">
                  <Icon as={Lock} color="white" boxSize={"12px"} />
                </Circle>
              </Tooltip>
            )}
          </Box>
        </Card.Header>
        <Card.Body gap="6px">
          <Box display="flex" p={0} m={0} alignItems="center" gap="6px">
            <ConditionalWrapper
              condition={isClickable}
              wrapper={({ children }) => (
                <LinkOverlay asChild>
                  <NextLink href={`/xnode/${node.id}`}>{children}</NextLink>
                </LinkOverlay>
              )}>
              <Text textStyle="sm">{t("Node")}</Text>
            </ConditionalWrapper>
            {isNodeDelegator && (
              <Badge variant="info" size="sm">
                {t("Not managed")}
              </Badge>
            )}
          </Box>
          <Text textStyle="md" fontWeight="semibold">{`${node.metadata?.name} #${node.id}`}</Text>
          <HStack>
            <Badge w="fit-content" color="text.default" py={0} variant="neutral" borderRadius="sm">
              {t("{{value}} points", { value: node?.endorsementScore?.toString() })}
            </Badge>
            {!isMobile && isNodeDelegator && (
              <Text textStyle="sm" color="text.subtle">
                {t("Managed externally by {{addressOrDomain}}", { addressOrDomain: managerAddressOrDomain })}
              </Text>
            )}
          </HStack>
        </Card.Body>

        {!isMobile && (
          <Card.Footer p="0">
            {isNodeDelegator ? (
              <Button asChild variant="link" _hover={{ textDecoration: "none" }}>
                <NextLink href={STARGATE_APP_URL} target="_blank" rel="noopener noreferrer">
                  {t("Open Stargate")}
                </NextLink>
              </Button>
            ) : isClickable ? (
              <FaChevronRight />
            ) : null}
          </Card.Footer>
        )}
      </Card.Root>
    </LinkBox>
  )
}

import { Card, Icon, LinkBox, LinkOverlay, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo } from "react"
import { IoIosArrowForward } from "react-icons/io"

import { GrantDetail } from "@/app/grants/types"
import { ProposalStatusBadge } from "@/app/proposals/components/ProposalStatusBadge"
import { ProposalDetail } from "@/app/proposals/types"

export const ProposalBox = ({
  proposalId,
  metadata,
  state: proposalState,
  depositReached: isDepositReached,
}: Pick<ProposalDetail | GrantDetail, "proposalId" | "metadata" | "state" | "depositReached">) => {
  const [isDesktop] = useMediaQuery(["(min-width: 500px)"])
  const title = useMemo(() => {
    if (!metadata?.title) return "Proposal title temporarily unavailable"
    if (isDesktop && metadata.title.length > 95) return metadata.title.slice(0, 95) + "..."
    if (!isDesktop && metadata.title.length > 38) return metadata.title.slice(0, 38) + "..."
    return metadata.title
  }, [metadata?.title, isDesktop])
  return (
    <LinkBox asChild>
      <Card.Root w={"full"} variant="subtle" p="3">
        <Card.Body display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
          <VStack w={"full"} alignItems={"start"} gap={2}>
            <ProposalStatusBadge
              proposalState={proposalState}
              isDepositReached={isDepositReached}
              badgeProps={{ textStyle: "xs" }}
            />
            <LinkOverlay asChild>
              <NextLink href={`/proposals/${proposalId.toString()}`}>
                <Text textStyle="sm" fontWeight="semibold">
                  {title}
                </Text>
              </NextLink>
            </LinkOverlay>
          </VStack>
          <Icon as={IoIosArrowForward} boxSize={{ base: 4, md: 6 }} color="icon.default" />
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}

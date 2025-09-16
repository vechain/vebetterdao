import { Box, VStack, Heading, Text, Grid, GridItem, Card, Icon } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

import ProposalIcon from "@/components/Icons/svg/proposal.svg"
import VoteIcon from "@/components/Icons/svg/vote.svg"
import HandshakeIcon from "@/components/Icons/svg/handshake.svg"

interface StatsCardProps {
  icon: React.ElementType
  value: number | string
  label: string
}

const StatsCard = ({ icon, value, label }: StatsCardProps) => (
  <Card.Root
    variant="base"
    flex={{ base: "0 0 40%", lg: "1 0 calc(30% - 10px)" }}
    flexDirection="row"
    alignItems="center"
    gap={4}
    w="full"
    h="full"
    py={{ base: 3, lg: 6 }}
    pl={{ base: 5, lg: 6 }}>
    <Box
      bg="bg.tertiary"
      borderRadius="full"
      minW={{ base: "40px", lg: "72px" }}
      h={{ base: "40px", lg: "72px" }}
      display="flex"
      alignItems="center"
      justifyContent="center">
      <Icon as={icon} boxSize="60px" color="brand.primary" />
    </Box>
    <VStack alignItems="flex-start" gap={0}>
      <Heading size={{ base: "lg", lg: "2xl" }}>{value}</Heading>
      <Text fontSize={{ base: "xs", lg: "sm" }} color="text.subtle">
        {label}
      </Text>
    </VStack>
  </Card.Root>
)
export const GrantsStatsCards = ({
  totalApplications,
  totalApproved,
  totalFunds,
}: {
  totalApplications: number
  totalApproved: number
  totalFunds: number
}) => {
  const compactFormatter = getCompactFormatter(4)
  const statsUI = [
    { icon: ProposalIcon, value: totalApplications, label: "Applications" },
    { icon: VoteIcon, value: totalApproved, label: "Grants Approved" },
    {
      icon: HandshakeIcon,
      value: `${compactFormatter.format(totalFunds)} B3TR`,
      label: "Distributed in grants",
    },
  ]
  return (
    <Box
      w="full"
      overflowX={{ base: "auto", lg: "hidden" }}
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
        "-webkit-overflow-scrolling": "touch",
      }}>
      <Grid
        w={{ base: "max-content", lg: "full" }}
        templateColumns={{ base: "repeat(3, 55vw)", lg: "repeat(3, 1fr)" }}
        gap={8}>
        {statsUI.map(stat => (
          <GridItem key={`${stat.label}`}>
            <StatsCard {...stat} />
          </GridItem>
        ))}
      </Grid>
    </Box>
  )
}

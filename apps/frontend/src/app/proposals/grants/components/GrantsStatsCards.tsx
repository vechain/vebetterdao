import { Box, VStack, Heading, Text, Image, Grid, GridItem, Card } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
interface StatsCardProps {
  icon: string
  value: number | string
  label: string
  alt: string
}

const StatsCard = ({ icon, value, label, alt }: StatsCardProps) => (
  <Card
    variant="base"
    flex={{ base: "0 0 40%", lg: "1 0 calc(30% - 10px)" }}
    flexDirection="row"
    alignItems="center"
    gap={4}
    w="full"
    h="full"
    py={{ base: 2, lg: 6 }}
    pl={{ base: 4, lg: 6 }}>
    <Box
      bg="light-contrast-on-card-bg"
      borderRadius="full"
      minW={{ base: "64px", lg: "72px" }}
      h={{ base: "64px", lg: "72px" }}
      display="flex"
      alignItems="center"
      justifyContent="center">
      <Image src={icon} alt={alt} boxSize={{ base: "40px", lg: "50px" }} />
    </Box>
    <VStack alignItems="flex-start" spacing={1}>
      <Heading size={{ base: "md", lg: "lg" }}>{value}</Heading>
      <Text fontSize={{ base: "xs", lg: "sm" }} color="gray.600">
        {label}
      </Text>
    </VStack>
  </Card>
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
  console.log("totalFunds", totalFunds)
  const statsUI = [
    { icon: "/assets/icons/proposal.svg", value: totalApplications, label: "Applications", alt: "applications-icon" },
    { icon: "/assets/icons/vote.svg", value: totalApproved, label: "Grants Approved", alt: "approved-icon" },
    {
      icon: "/assets/icons/handshake.svg",
      value: `${compactFormatter.format(totalFunds)} B3TR`,
      label: "Distributed in grants",
      alt: "total-icon",
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
        templateColumns={{ base: "repeat(3, 300px)", lg: "repeat(3, 1fr)" }}
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

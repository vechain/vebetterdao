import { Box, HStack, VStack, Heading, Text, Image, Grid, GridItem } from "@chakra-ui/react"
interface StatsCardProps {
  icon: string
  value: string
  label: string
  alt: string
}

const StatsCard = ({ icon, value, label, alt }: StatsCardProps) => (
  <HStack
    flex={{ base: "0 0 40%", lg: "1 0 calc(30% - 10px)" }}
    bg="contrast-bg-muted"
    borderRadius="xl"
    py={{ base: 2, lg: 6 }}
    pl={{ base: 4, lg: 6 }}
    h="full">
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
  </HStack>
)
export const GrantsStatsCards = ({
  totalApplications,
  totalApproved,
  totalFunds,
}: {
  totalApplications: string
  totalApproved: string
  totalFunds: string
}) => {
  const statsUI = [
    { icon: "/assets/icons/proposal.svg", value: totalApplications, label: "Applications", alt: "applications-icon" },
    { icon: "/assets/icons/vote.svg", value: totalApproved, label: "Grants Approved", alt: "approved-icon" },
    { icon: "/assets/icons/handshake.svg", value: totalFunds, label: "Distributed in grants", alt: "total-icon" },
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

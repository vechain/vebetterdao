import { Box, HStack, VStack, Heading, Text, Image } from "@chakra-ui/react"
interface StatsCardProps {
  icon: string
  value: string
  label: string
  alt: string
}

const StatsCard = ({ icon, value, label, alt }: StatsCardProps) => (
  <HStack
    flex={{ base: "0 0 40%", md: "1 0 calc(33.333% - 10px)" }}
    bg="contrast-bg-muted"
    borderRadius="xl"
    p={6}
    h="full">
    <Box
      bg="light-contrast-on-card-bg"
      borderRadius="full"
      p={5}
      minW={{ base: "64px", md: "72px" }}
      h={{ base: "64px", md: "72px" }}
      display="flex"
      alignItems="center"
      justifyContent="center">
      <Image src={icon} alt={alt} boxSize={{ base: "32px", md: "40px" }} />
    </Box>
    <VStack alignItems="flex-start" spacing={1}>
      <Heading size="lg">{value}</Heading>
      <Text fontSize="sm" color="gray.600">
        {label}
      </Text>
    </VStack>
  </HStack>
)
export const GrantsStatsCards = ({ stats }: { stats: string[] }) => {
  const statsUI = [
    { icon: "/assets/icons/proposal.svg", label: "Applications", alt: "applications-icon" },
    { icon: "/assets/icons/vote.svg", label: "Grants Approved", alt: "approved-icon" },
    { icon: "/assets/icons/handshake.svg", label: "Applications", alt: "total-icon" },
  ]
  return (
    <Box
      w="full"
      overflowX={{ base: "auto", md: "visible" }}
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
        "-webkit-overflow-scrolling": "touch",
      }}>
      <HStack w={{ base: "max-content", md: "full" }} spacing={5}>
        {statsUI.map((stat, index) => (
          <StatsCard key={index} {...stat} value={stats[index] || "0"} />
        ))}
      </HStack>
    </Box>
  )
}

import { useProposalComments } from "@/api"
import {
  Card,
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
  HStack,
  Button,
  Flex,
  IconButton,
  Menu,
  Badge,
  Portal,
} from "@chakra-ui/react"
import { t } from "i18next"
import InfiniteScroll from "react-infinite-scroll-component"
import { ProposalVoteComment } from "./components/ProposalVoteComment"
import { useState } from "react"
import { UilFilter } from "@iconscout/react-unicons"

type VoteType = "For" | "Against" | "Abstain" | "All"

type Props = {
  proposalId: string
}

export const ProposalVoteCommentList = ({ proposalId }: Props) => {
  const { data, fetchNextPage, hasNextPage } = useProposalComments({ proposalId })
  const [activeFilter, setActiveFilter] = useState<VoteType>("All")

  const visibleComments =
    data?.pages
      .map(page => page.data)
      .flat()
      .filter(vote => {
        // Filter out Abstain votes with short comments
        if (vote.support === "ABSTAIN" && (!vote.reason || vote.reason.length < 5)) {
          return false
        }

        // Apply vote type filter
        if (activeFilter === "All") return true
        return (
          (activeFilter === "For" && vote.support === "FOR") ||
          (activeFilter === "Against" && vote.support === "AGAINST") ||
          (activeFilter === "Abstain" && vote.support === "ABSTAIN")
        )
      }) ?? []

  const filterMenu = () => {
    const activeFiltersCount = activeFilter !== "All" ? 1 : 0

    return (
      <Menu.Root
        closeOnSelect={false}
        positioning={{
          placement: "bottom-end",
          strategy: "fixed",
        }}
        lazyMount>
        <Menu.Trigger asChild position="relative">
          <IconButton variant="subtle" rounded="full" aria-label={t("Filters")} border="1px solid #D5D5D5" gap={2}>
            <UilFilter />
            {activeFiltersCount > 0 && (
              <Flex
                position="absolute"
                top="-8px"
                right="-8px"
                bg="black"
                color="white"
                borderRadius="full"
                w="20px"
                h="20px"
                justify="center"
                align="center"
                fontSize="xs"
                fontWeight="bold"
                boxShadow="0px 0px 4px rgba(0, 0, 0, 0.2)">
                {activeFiltersCount}
              </Flex>
            )}
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content maxW="300px" bg="gray.800" minW="200px" shadow="lg" borderRadius={"24px"} p={3}>
              <Text fontWeight="bold" mb={2}>
                {t("Vote Type")}
              </Text>
              <Flex flexWrap="wrap" gap={2} mb={4} flexDir="column">
                {["All", "For", "Against", "Abstain"].map(status => (
                  <Button
                    key={status}
                    size="sm"
                    onClick={() => setActiveFilter(status as VoteType)}
                    bg={activeFilter === status ? "black" : "white"}
                    color={activeFilter === status ? "white" : "black"}
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={activeFilter === status ? "black" : "gray.200"}
                    _hover={{
                      bg: activeFilter === status ? "blackAlpha.800" : "gray.100",
                    }}
                    px={3}
                    py={1}
                    fontWeight="medium">
                    {status}{" "}
                    {activeFilter === status && (
                      <Badge ml={1} colorScheme="white" borderRadius="full" px={2}>
                        {visibleComments.length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </Flex>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    )
  }

  return (
    <Card.Root variant="baseWithBorder">
      <Card.Body>
        <VStack alignItems="stretch" gap={4}>
          <HStack justifyContent="space-between" w="full">
            <Heading fontWeight={700} fontSize="24px">
              {t("Proposal Comments")}
            </Heading>
            {filterMenu()}
          </HStack>

          <InfiniteScroll
            dataLength={visibleComments.length}
            next={fetchNextPage}
            hasMore={hasNextPage}
            loader={
              <Center p={4}>
                <Spinner size="md" mt={4} alignSelf="center" />
              </Center>
            }
            endMessage={
              <Heading size="xl" textAlign={"center"} mt={4}>
                {t("You reached the end!")}
              </Heading>
            }>
            <VStack alignItems="stretch">
              {visibleComments?.map(vote => (
                <ProposalVoteComment key={vote.voter} vote={vote} />
              ))}
            </VStack>
          </InfiniteScroll>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

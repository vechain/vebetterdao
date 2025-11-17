"use client"

import {
  Button,
  HStack,
  Heading,
  Dialog,
  CloseButton,
  VStack,
  RadioCard,
  For,
  LinkBox,
  LinkOverlay,
  ButtonGroup,
  IconButton,
  Pagination,
  Badge,
  Text,
  Skeleton,
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { NavArrowLeft, NavArrowRight } from "iconoir-react"
import NextLink from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

import { Modal } from "@/components/Modal"
import { SearchField } from "@/components/SearchField/SearchField"
import { useGetRoundsDates } from "@/hooks/useGetRoundsDates"

const PAGE_SIZE = 10
const DATE_FORMAT = "MMM D"

export const ViewAllRoundsButton = ({ currentRoundId }: { currentRoundId: number }) => {
  const [isRoundSelectionModalOpen, setIsRoundSelectionModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const searchParams = useSearchParams()
  const selectedRound = searchParams.get("roundId") || null

  const roundsArray = Array(currentRoundId)
    .fill(null)
    .map((_, idx) => currentRoundId - idx)
  const { data: roundsDatesMap, isLoading: roundsDatesMapLoading } = useGetRoundsDates()

  const filteredRounds = roundsArray.filter(round => round.toString().toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedRounds = filteredRounds.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <>
      <Button variant="link" p="0" size="md" onClick={() => setIsRoundSelectionModalOpen(true)}>
        {"View all rounds"}
      </Button>
      <Modal
        isOpen={isRoundSelectionModalOpen}
        onClose={() => {
          setSearchQuery("")
          setIsRoundSelectionModalOpen(false)
        }}
        showHeader={false}
        showCloseButton={false}
        modalContentProps={{ maxWidth: "400px" }}>
        <HStack w="full" justifyContent="space-between" alignItems="center">
          <Heading size="xl">{"All rounds"}</Heading>
          <Dialog.CloseTrigger asChild position="static">
            <CloseButton />
          </Dialog.CloseTrigger>
        </HStack>
        <VStack align="stretch" gap="3" my="5">
          <SearchField
            inputProps={{ size: "xl" }}
            placeholder="Search round"
            value={searchQuery}
            onChange={setSearchQuery}
          />

          <RadioCard.Root rounded="lg" colorPalette="blue" value={selectedRound}>
            <For each={paginatedRounds}>
              {round => (
                <RadioCard.Item key={round} as={LinkBox} value={round.toString()} rounded="lg">
                  <RadioCard.ItemHiddenInput />
                  <RadioCard.ItemControl alignItems="center">
                    <RadioCard.ItemIndicator />
                    <RadioCard.ItemContent>
                      <RadioCard.ItemText
                        w="full"
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between">
                        <LinkOverlay asChild onClick={() => setIsRoundSelectionModalOpen(false)}>
                          <NextLink href={`/allocations/round/?roundId=${round}`}>{round}</NextLink>
                        </LinkOverlay>
                        {currentRoundId === round && <Badge variant="positive">{"Active"}</Badge>}
                      </RadioCard.ItemText>
                      <Skeleton loading={roundsDatesMapLoading}>
                        <RadioCard.ItemDescription>
                          {roundsDatesMap
                            ? `${dayjs(roundsDatesMap.get(round)?.startDate).format(DATE_FORMAT)} - ${dayjs(roundsDatesMap.get(round)?.endDate).format(DATE_FORMAT)}`
                            : ""}
                        </RadioCard.ItemDescription>
                      </Skeleton>
                    </RadioCard.ItemContent>
                  </RadioCard.ItemControl>
                </RadioCard.Item>
              )}
            </For>
          </RadioCard.Root>

          <Pagination.Root
            mx={{ base: "auto", md: "unset" }}
            count={filteredRounds.length}
            pageSize={PAGE_SIZE}
            page={currentPage}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="4"
            siblingCount={1}
            onPageChange={page => setCurrentPage(page.page)}>
            <HStack gap="1">
              <Text textStyle="sm">{"Showing"}</Text>
              <Pagination.PageText format="long" textStyle="sm" />
            </HStack>
            <ButtonGroup variant="ghost" size="xs">
              <Pagination.PrevTrigger asChild>
                <IconButton>
                  <NavArrowLeft />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.NextTrigger asChild>
                <IconButton>
                  <NavArrowRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </VStack>
      </Modal>
    </>
  )
}

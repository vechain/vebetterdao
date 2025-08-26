import { useTranslation } from "react-i18next"
import { useCallback, useMemo, useState } from "react"
import { useTransactions } from "@/api"
import { VStack, Heading, Card, Text, HStack, Menu, Spinner, Center, Portal } from "@chakra-ui/react"
import { TransactionCard } from "@/components"
import { FaChevronDown, FaChevronLeft, FaChevronUp } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import dayjs from "dayjs"
import InfiniteScroll from "react-infinite-scroll-component"
import { TransactionType } from "@/constants"

type Props = {
  address: string
}

export const TransactionsContent = ({ address }: Props) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const filters: { id: TransactionType | "all"; label: string }[] = useMemo(
    () => [
      {
        id: "all",
        label: t("All transactions"),
      },
      {
        id: TransactionType.B3TR_ACTION,
        label: t("Better Action"),
      },
      {
        id: TransactionType.SWAP,
        label: t("Token conversion"),
      },
      {
        id: TransactionType.CLAIM_REWARD,
        label: t("Rewards"),
      },
      {
        id: TransactionType.PROPOSAL_SUPPORT,
        label: t("Proposal support"),
      },
      {
        id: TransactionType.UPGRADE_GM,
        label: t("Galaxy member"),
      },
    ],
    [t],
  )

  const [filterId, setFilterId] = useState<string>("all")

  const selectedFilter = useMemo(() => filters.find(filter => filter.id === filterId), [filterId, filters])

  const { data, fetchNextPage, hasNextPage } = useTransactions({
    user: address ?? "",
    txType: selectedFilter?.id === "all" ? undefined : (selectedFilter?.id as TransactionType),
  })
  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])
  const groupTransactionsByDay = (transactions: any[]) => {
    return transactions
      .sort((a, b) => b.blockTimestamp - a.blockTimestamp)
      .reduce<Record<string, any>>(
        (grouped, transaction) => {
          const day = dayjs.unix(transaction.blockTimestamp).format("YYYY-MM-DD")
          // Ensure the group for this day is initialized
          if (!grouped[day]) {
            grouped[day] = [] // This guarantees grouped[day] is always an array
          }

          // Now safely push into grouped[day]
          grouped[day].push(transaction)

          return grouped
        },
        {} as Record<string, any[]>,
      )
  }
  const groupedTransactions = groupTransactionsByDay(transactions)

  const router = useRouter()
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <Card.Root w={"full"} variant={"baseWithBorder"}>
      <Card.Body>
        <VStack gap={6} align="stretch">
          <HStack color="#004CFC" cursor="pointer" onClick={handleGoBack} mb="2">
            <FaChevronLeft />
            <Text>{t("Go back")}</Text>
          </HStack>
          <Menu.Root open={open} onOpenChange={details => setOpen(details.open)}>
            <Menu.Trigger asChild>
              <HStack>
                <Heading size="md">{selectedFilter?.label}</Heading>
                {open ? <FaChevronUp color="#004CFC" /> : <FaChevronDown color="#004CFC" />}
              </HStack>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {filters.map(filter => (
                    <Menu.Item
                      key={filter.id}
                      value={filter.id}
                      onClick={() => setFilterId(filter.id)}
                      fontWeight={filter.id === filterId ? "bold" : "normal"}>
                      {filter.label}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <InfiniteScroll
            dataLength={transactions.length}
            next={fetchNextPage}
            hasMore={!!hasNextPage}
            style={{ overflowY: "hidden" }}
            loader={
              <Center>
                <Spinner size="md" mt={4} alignSelf="center" />
              </Center>
            }>
            <VStack gap={6} align="stretch">
              {transactions.length > 0 ? (
                Object.entries(groupedTransactions).map(([day, transactions]) => (
                  <VStack key={day} gap={3} align="stretch">
                    <Text fontWeight="600" color="#848484">
                      {dayjs(day).format("MMMM D YYYY").toUpperCase()}
                    </Text>
                    {transactions.map((transaction: any) => (
                      <TransactionCard key={transaction.txId} transaction={transaction} />
                    ))}
                  </VStack>
                ))
              ) : (
                <Text>{t("No transactions found")}</Text>
              )}
            </VStack>
          </InfiniteScroll>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

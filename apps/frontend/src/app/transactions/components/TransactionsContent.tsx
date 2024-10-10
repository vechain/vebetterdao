import { useTranslation } from "react-i18next"
import { useCallback, useMemo, useState } from "react"
import { useTransactions } from "@/api"
import {
  VStack,
  Heading,
  Card,
  CardBody,
  Text,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
} from "@chakra-ui/react"
import { TransactionCard } from "@/components"
import { FaChevronDown, FaChevronLeft, FaChevronUp } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import dayjs from "dayjs"
import InfiniteScroll from "react-infinite-scroll-component"
import { useWallet } from "@vechain/dapp-kit-react"
import { TransactionType } from "@/constants"

export const TransactionsContent = () => {
  const { t } = useTranslation()

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

  const { account } = useWallet()
  const { data, fetchNextPage, hasNextPage } = useTransactions({
    user: account ?? "",
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
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <HStack color="#004CFC" cursor="pointer" onClick={handleGoBack} mb="2">
            <FaChevronLeft />
            <Text>{t("Go back")}</Text>
          </HStack>
          <Menu>
            {({ isOpen }) => (
              <>
                <MenuButton as={HStack} cursor="pointer">
                  <HStack>
                    <Heading size="md">{selectedFilter?.label}</Heading>
                    {isOpen ? <FaChevronUp color="#004CFC" /> : <FaChevronDown color="#004CFC" />}
                  </HStack>
                </MenuButton>
                <MenuList>
                  {filters.map(filter => (
                    <MenuItem
                      key={filter.id}
                      onClick={() => setFilterId(filter.id)}
                      fontWeight={filter.id === filterId ? "bold" : "normal"}>
                      {filter.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </>
            )}
          </Menu>
          <InfiniteScroll
            dataLength={transactions.length}
            next={fetchNextPage}
            hasMore={!!hasNextPage}
            loader={<Spinner />}>
            <VStack spacing={6} align="stretch">
              {Object.entries(groupedTransactions).length === 0 ? (
                <Text>{t("No transactions found")}</Text>
              ) : transactions.length > 0 ? (
                Object.entries(groupedTransactions).map(([day, transactions]) => (
                  <VStack key={day} spacing={3} align="stretch">
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
      </CardBody>
    </Card>
  )
}

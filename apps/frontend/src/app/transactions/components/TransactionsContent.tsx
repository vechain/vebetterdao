import { TransactionType } from "@/components"
import { useTranslation } from "react-i18next"
import { useCallback, useMemo, useState } from "react"
import { useSustainabilityActions } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { VStack, Heading, Card, CardBody, Text, HStack, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react"
import { TransactionCard } from "@/components"
import { FaChevronDown, FaChevronLeft, FaChevronUp } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import dayjs from "dayjs"

export const TransactionsContent = () => {
  const { t } = useTranslation()

  const filters = useMemo(
    () => [
      {
        id: "all",
        label: t("All transactions"),
      },
      {
        id: "better-action",
        label: t("Better Action"),
      },
      {
        id: "swap",
        label: t("Token conversion"),
      },
      {
        id: "claim",
        label: t("Rewards"),
      },
      {
        id: "support",
        label: t("Proposal support"),
      },
      {
        id: "gm-upgrade",
        label: t("Galaxy member"),
      },
    ],
    [t],
  )

  const [filterId, setFilterId] = useState<string>("all")

  const selectedFilter = useMemo(() => filters.find(filter => filter.id === filterId), [filterId, filters])

  const { account } = useWallet()
  const { data } = useSustainabilityActions({
    wallet: account ?? undefined,
    direction: "desc",
  })

  const actions = useMemo(() => data?.pages.map(page => page.data).flat() ?? [], [data])

  const transactions = useMemo(() => {
    const _transactions: { id: string; type: TransactionType; data: any }[] = []
    // add better actions
    actions.forEach((action, index) => {
      _transactions.push({
        id: `better-action-${index}`,
        type: "better-action" as TransactionType,
        data: action,
      })
    })
    // TODO: fetch transactions
    // add mocked examples
    _transactions.push({
      id: "swap",
      type: "swap" as TransactionType,
      data: {
        type: "swap",
        amount: 100,
        blockTimestamp: dayjs().subtract(1, "day").unix(),
      },
    })
    _transactions.push({
      id: "claim",
      type: "claim" as TransactionType,
      data: {
        type: "claim",
        amount: 100,
        blockTimestamp: dayjs().subtract(1, "day").unix(),
      },
    })
    _transactions.push({
      id: "support",
      type: "support" as TransactionType,
      data: {
        type: "support",
        amount: 100,
        blockTimestamp: dayjs().subtract(1, "day").unix(),
      },
    })
    _transactions.push({
      id: "gm-upgrade",
      type: "gm-upgrade" as TransactionType,
      data: {
        type: "gm-upgrade",
        amount: 100,
        blockTimestamp: dayjs().subtract(1, "day").unix(),
      },
    })

    return _transactions.filter(transaction => {
      if (filterId === "all") return true
      return transaction.type === filterId
    })
  }, [actions, filterId])

  const groupTransactionsByDay = (transactions: any[]) => {
    return transactions
      .sort((a, b) => b.data.blockTimestamp - a.data.blockTimestamp)
      .reduce<Record<string, any>>(
        (grouped, transaction) => {
          const day = dayjs.unix(transaction.data.blockTimestamp).format("YYYY-MM-DD")
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
          <VStack spacing={6} align="stretch">
            {Object.entries(groupedTransactions).length === 0 ? (
              <Text>{t("No transactions found")}</Text>
            ) : (
              Object.entries(groupedTransactions).map(([day, transactions]) => (
                <VStack key={day} spacing={3} align="stretch">
                  <Text fontWeight="600" color="#848484">
                    {dayjs(day).format("MMMM D YYYY").toUpperCase()}
                  </Text>
                  {transactions.map((transaction: any) => (
                    <TransactionCard key={transaction.id} type={transaction.type} data={transaction.data} />
                  ))}
                </VStack>
              ))
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

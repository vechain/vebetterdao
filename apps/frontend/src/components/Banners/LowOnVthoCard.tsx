import { useAccountBalance, useB3trBalance, useVot3Balance } from "@/api"
import { Button, Card, CardBody, Grid, GridItem, Heading, Image, Link, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import BigNumber from "bignumber.js"
import { useWallet } from "@vechain/dapp-kit-react"
import { FiArrowUpRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"

const minVtho = 5
export const LowOnVthoCard: React.FC = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(account ?? undefined)
  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)

  const ownsTokens = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return false

    return b3trBalance.original !== "0" || vot3Balance.original !== "0"
  }, [b3trBalance, vot3Balance])

  const isLowOnVtho = useMemo(() => {
    return Number(balance?.energy.scaled) < minVtho
  }, [balance])

  const labels = useMemo(() => {
    if (!balance) return
    const balanceNumber = new BigNumber(balance.energy.scaled)
    if (balanceNumber.isZero())
      return {
        heading: "Not enough VTHO",
        body: "VTHO is used as gas in every transaction you complete in VeBetterDAO, like voting, swapping tokens, etc.",
      }
    return {
      heading: "You're low on VTHO ",
      body: "You're running low on VTHO, used as gas in every transaction you complete in VeBetterDAO, like voting, swapping tokens, etc.",
    }
  }, [balance])

  if (!account || balanceLoading || !isLowOnVtho || !ownsTokens) return null

  return (
    <Card
      borderColor={"#F29B32"}
      backgroundColor={"#FFF3E5"}
      variant={"baseWithBorder"}
      boxShadow={"0px 0px 5px #F29B32"}>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(4, 1fr)"]} gap={[4, 10]} w="full">
          <GridItem colSpan={1} alignContent={["start", "center"]} justifySelf={["start", "center"]}>
            <Image src="/images/alert.svg" boxSize={[16, 28]} alt="alert-icon" />
          </GridItem>
          <GridItem colSpan={3}>
            <VStack spacing={4} w="full" justifyContent={"start"} alignItems={"start"}>
              <Heading size="md" fontWeight={"800"}>
                {labels?.heading}
              </Heading>

              <Text size="sm">
                {labels?.body} <b>{t("Get more VTHO to get the best experience in the platform.")}</b>
              </Text>

              <Link href={"https://www.coinbase.com/en/how-to-buy/vethor-token"} isExternal>
                <Button mt={2} variant={"primaryAction"} borderRadius={"full"} rightIcon={<FiArrowUpRight />}>
                  {t("Get more VTHO")}
                </Button>
              </Link>
            </VStack>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  )
}

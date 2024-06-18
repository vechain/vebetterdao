import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  HStack,
  Heading,
  Icon,
  Image,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { IoWalletOutline } from "react-icons/io5"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useAppBalance } from "@/api/contracts/x2EarnRewardsPool"

const compactFormatter = getCompactFormatter(4)
const b3trLogo = "/images/logo/b3tr_logo_dark.svg"

export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { data: balance, isLoading: isBalanceLoading } = useAppBalance(app?.id ?? "")

  return (
    <Card w={"full"} variant="baseWithBorder">
      <CardHeader>
        <Heading size="md">{t("App balance")}</Heading>
      </CardHeader>
      <CardBody py={0}>
        <VStack bg={"#E5EEFF"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"} align="start">
          <Text fontSize="12px" fontWeight="400">
            {"Total B3TR Balance"}
          </Text>
          <HStack>
            <Image src={b3trLogo} boxSize={"30px"} alt="B3TR Icon" />
            <Skeleton isLoaded={!isBalanceLoading}>
              <Heading size={{ base: "2xl", md: "xl" }}>{compactFormatter.format(Number(balance))}</Heading>
            </Skeleton>
          </HStack>
        </VStack>
      </CardBody>
      <CardFooter>
        <Button
          mt={2}
          isDisabled={balance === "0.0" || !balance || isBalanceLoading}
          //   isLoading={isRewardsLoading || isClaimRewardsLoading}
          //   onClick={handleClaim}
          colorScheme="primary"
          borderRadius={"full"}
          w={"full"}>
          <Icon as={IoWalletOutline} mr={2} />
          {t("Withdraw")}
        </Button>
      </CardFooter>
    </Card>
  )
}

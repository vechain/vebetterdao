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
  useDisclosure,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { IoWalletOutline } from "react-icons/io5"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useAppBalance } from "@/api/contracts/x2EarnRewardsPool"
import { WithdrawModal } from "./WithdrawModal"

const compactFormatter = getCompactFormatter(4)

export const AppBalanceCard = () => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { app } = useCurrentAppInfo()
  const { data: balance, isLoading: isBalanceLoading } = useAppBalance(app?.id ?? "")

  return (
    <>
      <Card w={"full"} variant="baseWithBorder">
        <CardHeader>
          <Heading size="md">{t("App balance")}</Heading>
        </CardHeader>
        <CardBody py={0}>
          <VStack bg={"#E5EEFF"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"} align="start">
            <Text fontSize="12px" fontWeight="400">
              {t("Total B3TR Balance")}
            </Text>
            <HStack>
              <Image src={"/images/logo/b3tr_logo_dark.svg"} boxSize={"30px"} alt="B3TR Icon" />
              <Skeleton isLoaded={!isBalanceLoading}>
                <Heading size={{ base: "2xl", md: "xl" }}>{compactFormatter.format(Number(balance?.scaled))}</Heading>
              </Skeleton>
            </HStack>
          </VStack>
        </CardBody>
        <CardFooter>
          <Button
            mt={2}
            isDisabled={balance?.scaled === "0.0" || !balance || isBalanceLoading}
            onClick={onOpen}
            colorScheme="primary"
            borderRadius={"full"}
            w={"full"}>
            <Icon as={IoWalletOutline} mr={2} />
            {t("Withdraw")}
          </Button>
        </CardFooter>
      </Card>

      {app && (
        <WithdrawModal appId={app.id} teamWalletAddress={app?.teamWalletAddress} isOpen={isOpen} onClose={onClose} />
      )}
    </>
  )
}

import { Card, CardBody, VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LinkedAccountsItem } from "./components/LinkedAccountsItem"
import { useAccountLinking } from "@/api"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"

type Props = {
  address: string
}
export const LinkedAccounts = ({ address }: Props) => {
  const { t } = useTranslation()

  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount?.address ?? "", address)
  const { isLinked, passport, passportLinkedEntities, outgoingPendingLink, isLoading } = useAccountLinking(address)

  if (isLoading || (!isLinked && !outgoingPendingLink)) return null
  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={8}>
          <HStack justify={"space-between"} align={"flex-start"}>
            <VStack align="start">
              <Heading fontSize="xl" fontWeight="700">
                {t("Linked accounts")}
              </Heading>
              <Text color="#6A6A6A" fontSize="md">
                {t("Centralize all the Better Actions you make along your different accounts.")}
              </Text>
            </VStack>
          </HStack>
          <VStack align="start">
            <Heading fontSize="lg" fontWeight="700">
              {t("Primary account")}
            </Heading>
            <Text color="#6A6A6A" fontSize="sm">
              {t(
                "This is the account where all the Better Actions will be counted. You only can vote with this account.",
              )}
            </Text>
          </VStack>
          <LinkedAccountsItem
            isConnectedUser={isConnectedUser}
            account={outgoingPendingLink ? outgoingPendingLink : passport || ""}
          />
          <VStack align="start">
            <Heading fontSize="lg" fontWeight="700">
              {t("Secondary accounts")}
            </Heading>
            <Text color="#6A6A6A" fontSize="sm">
              {t(
                "All the Better Actions in these accounts will be counted in the primary account. You can not vote with these accounts.",
              )}
            </Text>
          </VStack>
          {outgoingPendingLink ? (
            <LinkedAccountsItem isConnectedUser={isConnectedUser} account={address ?? ""} pending={true} />
          ) : (
            <VStack gap={4} align="stretch">
              {passportLinkedEntities.map((account: string) => (
                <LinkedAccountsItem isConnectedUser={isConnectedUser} key={account} account={account} />
              ))}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

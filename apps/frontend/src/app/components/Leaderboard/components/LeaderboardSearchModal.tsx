import { BaseModal } from "@/components/BaseModal"
import { Center, Divider, Heading, Input, Spinner, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { useCallback, useState } from "react"
import { LeaderboardRankingComponent } from "./LeaderboardRakingComponent"
import { useResolveAddressOrVetDomain, useSustainabilityCurrentRoundOverview } from "@/api"
import { debounce } from "lodash"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const LeaderboardSearchModal = ({ isOpen, onClose }: Props) => {
  const [inputText, setInputText] = useState("")
  const [searchText, setSearchText] = useState("")
  const { data: address, error: resolvedAddressError } = useResolveAddressOrVetDomain(searchText)

  const { data, error: roundOverviewError, isLoading } = useSustainabilityCurrentRoundOverview(address?.address)

  //debounce on text change
  const onTextChange = useCallback(
    (text: string) => {
      setInputText(text)
      deboucedSearch(text)
    },
    [setInputText, setSearchText],
  )

  const deboucedSearch = useCallback(
    debounce((text: string) => {
      setSearchText(text)
    }, 500),
    [],
  )

  const isDeboucing = !isLoading && inputText !== searchText
  const parsedError = roundOverviewError?.message ?? resolvedAddressError?.message

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={t("Search for a user")}
      ariaDescription={t("Search for a user")}>
      <VStack spacing={4} align="stretch">
        <Heading fontSize="xl" fontWeight="700">
          {t("Search for a user")}
        </Heading>

        <Input
          placeholder="Search any address or vet domain..."
          value={inputText}
          onChange={e => onTextChange(e.target.value)}
        />
        <Divider />
        {(isLoading || isDeboucing) && !parsedError && (
          <Center>
            <Spinner />
          </Center>
        )}
        {parsedError && (
          <Text color="red.500" fontSize="sm">
            {parsedError ?? t("Error loading data")}
          </Text>
        )}
        {data && (
          <LeaderboardRankingComponent
            ranking={{
              address: data.entity,
              position: data.rankByReward,
              score: data.actionsRewarded,
            }}
          />
        )}
        {!inputText && !parsedError && (
          <Text color="gray.500" fontSize="sm">
            {t("Search for a user to see their position in the leaderboard")}
          </Text>
        )}
      </VStack>
    </BaseModal>
  )
}

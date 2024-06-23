import { XApp } from "@/api"
import { CastVoteData } from "@/store"
import {
  VStack,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  HStack,
  Skeleton,
  Heading,
  Checkbox,
} from "@chakra-ui/react"
import { UilSearch } from "@iconscout/react-unicons"
import { UseQueryResult } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { AppSelectableCard } from "./AppSelectableCard"
import { useTranslation } from "react-i18next"
import { NoAppsCard } from "./NoAppsCard"

type Props = {
  selectedApps: CastVoteData
  onSelectedAppsChange: (_selectedApps: CastVoteData) => void
  xAppsQuery: UseQueryResult<XApp[], Error>
}

const searchApp = (app: XApp, query: string) => {
  return app.name.toLowerCase().includes(query.toLowerCase())
}

export const SearchAndSelectApps = ({ selectedApps, onSelectedAppsChange, xAppsQuery }: Props) => {
  const { t } = useTranslation()
  const [appsToSearch, setAppsToSearch] = useState("")

  const onCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!xAppsQuery.data) return
      if (e.target.checked)
        return onSelectedAppsChange(xAppsQuery.data.map(xApp => ({ appId: xApp.id, value: 0, rawValue: 0 })))
      return onSelectedAppsChange([])
    },
    [onSelectedAppsChange, xAppsQuery],
  )

  const isSelectAllChecked = useMemo(() => {
    if (!xAppsQuery.data) return false
    return selectedApps.length === xAppsQuery.data.length
  }, [selectedApps, xAppsQuery.data])

  const filteredApps = useMemo(() => {
    if (!xAppsQuery.data) return []
    return xAppsQuery.data.filter(xApp => searchApp(xApp, appsToSearch))
  }, [appsToSearch, xAppsQuery.data])

  return (
    <VStack w="full" spacing={6}>
      <InputGroup>
        <InputLeftElement>
          <Icon as={UilSearch} boxSize={"24px"} color="#6A6A6A" />
        </InputLeftElement>
        <Input placeholder="Search for an app" value={appsToSearch} onChange={e => setAppsToSearch(e.target.value)} />
      </InputGroup>
      <HStack w="full" spacing={4} justify={"space-between"}>
        <Skeleton isLoaded={!xAppsQuery.isLoading}>
          <Heading fontSize={"20px"} fontWeight={700}>
            {t("{{amount}} participating apps", { amount: xAppsQuery.data?.length ?? "0" })}
          </Heading>
        </Skeleton>
        <Checkbox colorScheme="primary" onChange={onCheckboxChange} isChecked={isSelectAllChecked} size="lg">
          {t("Select all")}
        </Checkbox>
      </HStack>
      <VStack w="full" spacing={4}>
        {!filteredApps.length ? (
          <NoAppsCard onShowAllApps={() => setAppsToSearch("")} />
        ) : (
          filteredApps.map(xApp => {
            const isSelected = selectedApps.some(selectedApp => selectedApp.appId === xApp.id)
            const onSelect = () => {
              if (isSelected) {
                onSelectedAppsChange(selectedApps.filter(selectedApp => selectedApp.appId !== xApp.id))
              } else {
                onSelectedAppsChange([...selectedApps, { appId: xApp.id, value: 0, rawValue: 0 }])
              }
            }
            return <AppSelectableCard key={xApp.id} app={xApp} isSelected={isSelected} onSelect={onSelect} />
          })
        )}
      </VStack>
    </VStack>
  )
}

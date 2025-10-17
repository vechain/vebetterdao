import { VStack, InputGroup, Icon, Input, HStack, Skeleton, Heading, Checkbox } from "@chakra-ui/react"
import { UilSearch } from "@iconscout/react-unicons"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { XApp } from "../../../../../../../api/contracts/xApps/getXApps"
import { CastAllocationVoteFormData } from "../../../../../../../store/useCastAllocationFormStore"
import { splitEvenly } from "../../../utils/splitEvenly"

import { AppSelectableCard } from "./AppSelectableCard"
import { NoAppsCard } from "./NoAppsCard"

type Props = {
  selectedApps: CastAllocationVoteFormData[]
  onSelectedAppsChange: (_selectedApps: CastAllocationVoteFormData[]) => void
  xApps?: XApp[]
  isLoading?: boolean
}
const searchApp = (app: XApp, query: string) => {
  return app.name.toLowerCase().includes(query.toLowerCase())
}
export const SearchAndSelectApps = ({ selectedApps, onSelectedAppsChange, xApps, isLoading }: Props) => {
  const { t } = useTranslation()
  const [appsToSearch, setAppsToSearch] = useState("")
  const onCheckboxChange = useCallback(
    (checked: boolean) => {
      if (!xApps) return
      if (checked) {
        const data = xApps.map(xApp => ({ appId: xApp.id, ...splitEvenly(xApps.length) }))
        return onSelectedAppsChange(data)
      }
      return onSelectedAppsChange([])
    },
    [onSelectedAppsChange, xApps],
  )
  const isSelectAllChecked = useMemo(() => {
    if (!xApps) return false
    return selectedApps.length === xApps.length
  }, [selectedApps, xApps])
  const filteredApps = useMemo(() => {
    if (!xApps) return []
    return xApps.filter(xApp => searchApp(xApp, appsToSearch))
  }, [appsToSearch, xApps])
  return (
    <VStack w="full" gap={6}>
      <InputGroup startElement={<Icon as={UilSearch} boxSize={"24px"} color="text.subtle" />}>
        <Input
          size={"lg"}
          placeholder="Search for an app"
          value={appsToSearch}
          onChange={e => setAppsToSearch(e.target.value)}
          textStyle="md"
        />
      </InputGroup>
      <HStack w="full" gap={4} justify={"space-between"}>
        <Skeleton loading={isLoading}>
          <Heading size="xl">{t("{{amount}} participating apps", { amount: xApps?.length ?? "0" })}</Heading>
        </Skeleton>
        <Checkbox.Root
          colorPalette="primary"
          onCheckedChange={e => onCheckboxChange(!!e.checked)}
          checked={isSelectAllChecked}
          size="lg">
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>{t("Select all")}</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
      <VStack w="full" gap={4}>
        {!filteredApps.length ? (
          <NoAppsCard onShowAllApps={() => setAppsToSearch("")} />
        ) : (
          filteredApps.map(xApp => {
            const isSelected = selectedApps.some(selectedApp => selectedApp.appId === xApp.id)
            const onSelect = () => {
              if (isSelected) {
                const newApps = selectedApps.filter(selectedApp => selectedApp.appId !== xApp.id)
                const newAppsWithPercentages = newApps.map(app => ({ ...app, ...splitEvenly(newApps.length) }))
                onSelectedAppsChange(newAppsWithPercentages)
              } else {
                const newApps = [...selectedApps, { appId: xApp.id, value: 0, rawValue: 0 }]
                const newAppsWithPercentages = newApps.map(app => ({ ...app, ...splitEvenly(newApps.length) }))
                onSelectedAppsChange(newAppsWithPercentages)
              }
            }
            return <AppSelectableCard key={xApp.id} app={xApp} isSelected={isSelected} onSelect={onSelect} />
          })
        )}
      </VStack>
    </VStack>
  )
}

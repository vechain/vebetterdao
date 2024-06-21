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

type Props = {
  selectedApps: CastVoteData[]
  onSelectedAppsChange: (selectedApps: CastVoteData[]) => void
  xAppsQuery: UseQueryResult<XApp[], Error>
}
export const SearchAndSelectApps = ({ selectedApps, onSelectedAppsChange, xAppsQuery }: Props) => {
  const [appsToSearch, setAppsToSearch] = useState("")

  const onCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!xAppsQuery.data) return
      if (e.target.checked)
        return onSelectedAppsChange(xAppsQuery.data.map(xApp => ({ appId: xApp.id, votePercentage: 0 })))
      return onSelectedAppsChange([])
    },
    [onSelectedAppsChange, xAppsQuery],
  )

  const isSelectAllChecked = useMemo(() => {
    if (!xAppsQuery.data) return false
    return selectedApps.length === xAppsQuery.data.length
  }, [selectedApps, xAppsQuery.data])

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
          <Heading fontSize={"24px"} fontWeight={700}>
            {xAppsQuery.data?.length} participating apps
          </Heading>
        </Skeleton>
        <Checkbox colorScheme="primary" onChange={onCheckboxChange} isChecked={isSelectAllChecked}>
          Select all
        </Checkbox>
      </HStack>
    </VStack>
  )
}

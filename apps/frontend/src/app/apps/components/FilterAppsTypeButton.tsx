import { Button, Heading, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { GetAllApps } from "@/api"

type Props = {
  filterType: string
  currentFilter: string
  setFilter: (filter: string) => void
  isXAppsLoading: boolean
  xApps: GetAllApps | undefined
}

export const FilterAppsTypeButton = ({ filterType, currentFilter, setFilter, isXAppsLoading, xApps }: Props) => {
  const { t } = useTranslation()
  const isActive = filterType === currentFilter
  console.log("isXAppsLoading", isXAppsLoading)
  console.log("xApps", xApps)

  return (
    <Button
      w="auto"
      h="auto"
      minW={"auto"}
      variant="ghost"
      onClick={() => setFilter(filterType)}
      borderRadius={"24px"}
      px={"24px"}
      py="16px"
      bg={isActive ? "black" : "transparent"}
      color={isActive ? "white" : "black"}>
      <HStack spacing={2}>
        <Heading fontWeight={isActive ? 700 : 500} fontSize={"20px"}>
          {t("{{value}}", { value: filterType })}
        </Heading>
      </HStack>
    </Button>
  )
}

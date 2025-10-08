import { Button, Heading, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  filterType: string
  currentFilter: string
  setFilter: (filter: string) => void
}

export const FilterAppsTypeButton = ({ filterType, currentFilter, setFilter }: Props) => {
  const { t } = useTranslation()
  const isActive = filterType === currentFilter

  return (
    <Button
      w="auto"
      h="auto"
      minW={"auto"}
      onClick={() => setFilter(filterType)}
      borderRadius={"24px"}
      px={"24px"}
      py="16px"
      bg={isActive ? "black" : "transparent"}
      color={isActive ? "white" : "black"}
      _hover={{
        opacity: "0.6",
        transition: "all 0.3s",
      }}>
      <HStack gap={2}>
        <Heading fontWeight={isActive ? 700 : 500} size={"xl"}>
          {t("{{value}}", { value: filterType })}
        </Heading>
      </HStack>
    </Button>
  )
}

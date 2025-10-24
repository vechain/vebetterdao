import { Box, createListCollection, HStack, Select, useSelectContext } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { languages } from "@/i18n"

const languageCollection = createListCollection({
  items: languages.map(language => ({
    id: language.code,
    name: language.name,
    avatar: language.flag,
  })),
  itemToString: item => item.name,
  itemToValue: item => item.id,
})
const SelectValue = () => {
  const select = useSelectContext()
  const items = select.selectedItems as Array<{ name: string; avatar: string }>
  const { name, avatar } = items[0] || {}
  return (
    <Select.ValueText>
      <HStack gap="2">
        <Box>{avatar}</Box>
        <Box>{name}</Box>
      </HStack>
    </Select.ValueText>
  )
}
export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation()
  return (
    <Select.Root
      variant="subtle"
      rounded="full"
      collection={languageCollection}
      size={{ base: "md", md: "lg" }}
      defaultValue={["en"]}
      positioning={{ placement: "bottom", flip: false, sameWidth: true }}
      onValueChange={value => i18n.changeLanguage(value.value[0])}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger rounded="full">
          <SelectValue />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {languageCollection.items.map(item => (
            <Select.Item gap="2" item={item} key={item.id} justifyContent="flex-start">
              <Box>{item.avatar}</Box>
              <Box>{item.name}</Box>
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
}

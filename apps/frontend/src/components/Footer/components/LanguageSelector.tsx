import { Box, createListCollection, HStack, Select, Text, useSelectContext } from "@chakra-ui/react"
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
      <HStack gap="2" p={0}>
        <Box>{avatar}</Box>
        <Text textStyle="sm" fontWeight="bold" color="text.subtle" minW="80px">
          {name}
        </Text>
      </HStack>
    </Select.ValueText>
  )
}
export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation()
  const detectedLang = i18n.language?.split("-")[0] || "en"
  const currentLanguage = languageCollection.items.some(item => item.id === detectedLang) ? detectedLang : "en"

  return (
    <Select.Root
      variant="ghost"
      rounded="full"
      collection={languageCollection}
      size={{ base: "md", md: "lg" }}
      value={[currentLanguage]}
      positioning={{ placement: "top", flip: false, sameWidth: true }}
      onValueChange={value => i18n.changeLanguage(value.value[0])}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger pl={0} rounded="5px">
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
              <Text textStyle="sm" color="text.subtle">
                {item.name}
              </Text>
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
}

import { useTranslation } from "react-i18next"
import { IconButton, Menu, Text, HStack, VStack, Portal, Icon } from "@chakra-ui/react"
import { UilSortAmountDown, UilCheck } from "@iconscout/react-unicons"
import { SortOption, sortOptions } from "@/types/appDetails"

type Props = {
  sortOption: string
  onSortChange: (option: SortOption) => void
}

export const SortingMenu = ({ sortOption, onSortChange }: Props) => {
  const { t } = useTranslation()

  return (
    <Menu.Root closeOnSelect={true} positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <IconButton
          variant="outline"
          rounded="full"
          aria-label={t("Sort by")}
          borderRadius={"24px"}
          size="xl"
          bgColor="bg.primary"
          border="sm"
          borderColor="border.primary">
          <UilSortAmountDown />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW="100px"
            shadow="lg"
            borderRadius={"24px"}
            p={2}
            bg="info-bg"
            borderColor="contrast-border"
            borderWidth="1px">
            {sortOptions.map(option => (
              <Menu.Item
                key={option.id}
                value={option.id}
                onClick={() => onSortChange(option.id)}
                role="group"
                borderRadius={"16px"}
                bg={sortOption === option.id && sortOption !== "default" ? "info-bg" : undefined}
                _hover={{
                  bg: "hover-contrast-bg",
                  color: "contrast-fg-on-muted",
                  transition: "all 0.3s ease-in-out",
                }}>
                <HStack justifyContent="space-between" w="full">
                  <VStack align="flex-start" gap={0}>
                    <Text fontWeight={sortOption === option.id && sortOption !== "default" ? "semibold" : "normal"}>
                      {option.label}
                    </Text>
                    <Text textStyle="xs" color="gray.500">
                      {option.description}
                    </Text>
                  </VStack>
                  {sortOption === option.id && sortOption !== "default" && (
                    <Icon as={UilCheck} color="black" boxSize={5} />
                  )}
                </HStack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

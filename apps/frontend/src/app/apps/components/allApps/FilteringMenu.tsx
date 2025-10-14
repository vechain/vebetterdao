import { IconButton, Menu, Text, Flex, VStack, Portal, Button, Badge, Checkbox } from "@chakra-ui/react"
import { UilFilter } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { APP_CATEGORIES } from "@/types/appDetails"

type Props = {
  selectedCategories: string[]
  statusFilter: string
  statusFilterOptions: string[]
  appWithStatusCounts: Record<string, number>
  onCategoryChange: (categoryId: string) => void
  onStatusFilterChange: (status: string) => void
}
export const FilteringMenu = ({
  selectedCategories,
  statusFilter,
  statusFilterOptions,
  appWithStatusCounts,
  onCategoryChange,
  onStatusFilterChange,
}: Props) => {
  const { t } = useTranslation()
  const activeFiltersCount = selectedCategories.length || 0
  return (
    <Menu.Root closeOnSelect={false} positioning={{ placement: "bottom" }} lazyMount>
      <Menu.Trigger>
        <IconButton
          size="xl"
          rounded="full"
          aria-label={t("Filters")}
          variant="outline"
          bgColor="bg.primary"
          border="sm"
          borderColor="border.primary">
          <UilFilter />
        </IconButton>
        {activeFiltersCount > 0 && (
          <Flex
            position="absolute"
            top="-8px"
            right="-8px"
            bg={"contrast-fg-on-muted"}
            color={"contrast-fg-on-strong"}
            borderRadius="full"
            w="20px"
            h="20px"
            justify="center"
            align="center"
            textStyle="xs"
            fontWeight="bold"
            boxShadow="0px 0px 4px rgba(0, 0, 0, 0.2)">
            {activeFiltersCount}
          </Flex>
        )}
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            maxW="300px"
            minW="200px"
            shadow="lg"
            borderRadius={"24px"}
            p={3}
            borderColor="#d5d5d5"
            borderWidth="1px">
            {/* Governance Status Section */}
            <Text fontWeight="bold" mb={2}>
              {t("Status")}
            </Text>
            <Flex flexWrap="wrap" gap={2} mb={4} flexDir="column">
              {statusFilterOptions.map(status => (
                <Button
                  key={status}
                  rounded="full"
                  variant={statusFilter === status ? "solid" : "subtle"}
                  size="sm"
                  onClick={() => onStatusFilterChange(status)}
                  px={3}
                  py={1}>
                  {status}{" "}
                  {statusFilter === status && (
                    <Badge ml={1} borderRadius="full">
                      {appWithStatusCounts[status as keyof typeof appWithStatusCounts]}
                    </Badge>
                  )}
                </Button>
              ))}
            </Flex>

            <Menu.Separator />

            {/* Categories Section */}
            <Text fontWeight="bold" mb={2} mt={2}>
              {t("Categories")}
            </Text>
            <VStack align="start" gap={2} pl={2}>
              {APP_CATEGORIES.map(category => (
                <Checkbox.Root
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => onCategoryChange(category.id)}
                  colorPalette="blue">
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontWeight={selectedCategories.includes(category.id) ? "semibold" : "normal"}>
                    {category.name}
                  </Checkbox.Label>
                </Checkbox.Root>
              ))}
            </VStack>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

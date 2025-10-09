import {
  Box,
  Text,
  VStack,
  HStack,
  Tag,
  Popover,
  Button,
  Input,
  InputGroup,
  Flex,
  useDisclosure,
  Portal,
  CloseButton,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FaSearch, FaPlus } from "react-icons/fa"

import { APP_CATEGORIES, MAX_CATEGORIES } from "@/types/appDetails"

import { EditAppForm } from "../../EditAppPageContent"

type EditAppCategoriesProps = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}
export const EditAppCategories = ({ form }: EditAppCategoriesProps) => {
  const { t } = useTranslation()
  const { open: isOpen, onOpen, onClose, setOpen } = useDisclosure()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const { setValue, watch, register } = form
  const selectedCategories = watch("categories") ?? []
  const filteredCategories = APP_CATEGORIES.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const maxAllowedCategories = MAX_CATEGORIES
  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setValue(
        "categories",
        selectedCategories.filter(id => id !== categoryId),
        { shouldDirty: true },
      )
    } else if (selectedCategories.length < maxAllowedCategories) {
      setValue("categories", [...selectedCategories, categoryId], { shouldDirty: true })
    }
    if (selectedCategories.length + 1 >= maxAllowedCategories && !selectedCategories.includes(categoryId)) {
      onClose()
    }
  }

  const handleRemoveCategory = (categoryId: string) => {
    setValue(
      "categories",
      selectedCategories.filter(id => id !== categoryId),
      { shouldDirty: true },
    )
  }

  const getCategoryById = (categoryId: string) => {
    return APP_CATEGORIES.find(category => category.id === categoryId)
  }

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("")
    }
    register("categories", {
      required: { value: true, message: t("Categories are required") },
    })
  }, [isOpen, register, t])

  return (
    <VStack align="flex-start" gap={4} width="full">
      <Text textStyle="md" fontWeight="semibold">
        {t("App Categories")}
      </Text>

      <HStack gap={3} flexWrap="wrap" alignItems="flex-start">
        {selectedCategories.map(categoryId => {
          const category = getCategoryById(categoryId)
          if (!category) return null

          return (
            <Tag.Root
              key={categoryId}
              size="lg"
              textStyle="sm"
              borderRadius="full"
              variant="solid"
              backgroundColor={category.color}
              color="black"
              mb={2}>
              <Tag.Label>{category.name}</Tag.Label>
              <Tag.CloseTrigger asChild>
                <CloseButton size="sm" color="gray" onClick={() => handleRemoveCategory(categoryId)} />
              </Tag.CloseTrigger>
            </Tag.Root>
          )
        })}

        {selectedCategories.length < maxAllowedCategories && (
          <Popover.Root
            open={isOpen}
            onOpenChange={details => {
              if (!details.open) onClose()
              else onOpen()
            }}
            positioning={{ placement: "bottom-start" }}
            closeOnInteractOutside={true}>
            <Popover.Trigger asChild>
              <Button onClick={() => setOpen(true)} variant="outline" textStyle="sm" borderRadius="full" size="sm">
                <FaPlus />
                {t("Add Category")}
              </Button>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content width="300px" maxH="400px" overflowY="auto">
                  <Popover.Body p={3}>
                    <VStack gap={3} align="stretch">
                      <InputGroup startElement={<FaSearch color="text.subtle" />}>
                        <Input
                          size="md"
                          placeholder={t("Find a category")}
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          borderRadius="md"
                        />
                      </InputGroup>

                      {filteredCategories.length === 0 ? (
                        <Text textAlign="center" py={2} color="text.subtle">
                          {t("No categories found")}
                        </Text>
                      ) : (
                        filteredCategories.map(category => (
                          <Flex
                            key={category.id}
                            p={2}
                            borderRadius="md"
                            alignItems="center"
                            cursor="pointer"
                            bg={selectedCategories.includes(category.id) ? "primary.50" : "transparent"}
                            _hover={{ bg: "gray.100" }}
                            _dark={{
                              bg: selectedCategories.includes(category.id) ? "primary.900" : "transparent",
                              _hover: { bg: "gray.900" },
                            }}
                            onClick={() => handleSelectCategory(category.id)}>
                            <Box width="12px" height="12px" borderRadius="full" bg={category.color} mr={3} />
                            <Text>{category.name}</Text>
                          </Flex>
                        ))
                      )}
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        )}
      </HStack>

      {selectedCategories.length === 0 && (
        <Text color="text.subtle" textStyle="sm">
          {t("No categories selected. Select up to 2 categories.")}
        </Text>
      )}
    </VStack>
  )
}

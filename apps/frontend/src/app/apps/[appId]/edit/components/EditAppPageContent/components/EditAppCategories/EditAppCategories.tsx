import { useEffect, useState } from "react"
import {
  Box,
  Text,
  VStack,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  useDisclosure,
} from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { FaSearch, FaPlus } from "react-icons/fa"
import { useTranslation } from "react-i18next"
import { EditAppForm } from "../../EditAppPageContent"
import { APP_CATEGORIES, MAX_CATEGORIES } from "@/types/appDetails"

type EditAppCategoriesProps = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditAppCategories = ({ form }: EditAppCategoriesProps) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
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
    <VStack align="flex-start" spacing={4} width="full">
      <Text fontSize={16} fontWeight={500}>
        {t("App Categories")}
      </Text>

      <HStack spacing={3} flexWrap="wrap" alignItems="flex-start">
        {selectedCategories.map(categoryId => {
          const category = getCategoryById(categoryId)
          if (!category) return null

          return (
            <Tag
              key={categoryId}
              size="lg"
              fontSize="14px"
              borderRadius="full"
              variant="solid"
              backgroundColor={category.color}
              color="black"
              mb={2}>
              <TagLabel>{category.name}</TagLabel>
              <TagCloseButton onClick={() => handleRemoveCategory(categoryId)} />
            </Tag>
          )
        })}

        {selectedCategories.length < maxAllowedCategories && (
          <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start" closeOnBlur={true}>
            <PopoverTrigger>
              <Button leftIcon={<FaPlus />} variant="outline" fontSize="14px" borderRadius="full" size="sm">
                {t("Add Category")}
              </Button>
            </PopoverTrigger>
            <PopoverContent width="300px" maxH="400px" overflowY="auto">
              <PopoverBody p={3}>
                <VStack spacing={3} align="stretch">
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <FaSearch color="#6A6A6A" />
                    </InputLeftElement>
                    <Input
                      placeholder={t("Find a category")}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      borderRadius="md"
                    />
                  </InputGroup>

                  {filteredCategories.length === 0 ? (
                    <Text textAlign="center" py={2} color="#6A6A6A">
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
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )}
      </HStack>

      {selectedCategories.length === 0 && (
        <Text color="#6A6A6A" fontSize="sm">
          {t("No categories selected. Select up to 2 categories.")}
        </Text>
      )}
    </VStack>
  )
}

import { useEffect, useState } from "react"
import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  Path,
  FieldValues,
  RegisterOptions,
  PathValue,
} from "react-hook-form"
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
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/react"
import { FaSearch, FaPlus } from "react-icons/fa"
import { useTranslation } from "react-i18next"
import { APP_CATEGORIES, MAX_CATEGORIES } from "@/types/appDetails"

type CategoryType = {
  id: string
  name: string
  color: string
}

type CategorySelectorProps<T extends FieldValues> = {
  fieldName: Path<T>
  register: UseFormRegister<T>
  setValue: UseFormSetValue<T>
  watch: UseFormWatch<T>
  error?: string
  maxCategories?: number
  categories?: CategoryType[]
  registerOptions?: RegisterOptions
}

export const CategorySelector = <T extends FieldValues>({
  fieldName,
  register,
  setValue,
  watch,
  error,
  maxCategories = MAX_CATEGORIES,
  categories = APP_CATEGORIES,
  registerOptions,
}: CategorySelectorProps<T>) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [searchQuery, setSearchQuery] = useState<string>("")

  const selectedCategories: string[] = watch(fieldName) ?? []
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setValue(fieldName, selectedCategories.filter(id => id !== categoryId) as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } else if (selectedCategories.length < maxCategories) {
      setValue(fieldName, [...selectedCategories, categoryId] as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    if (selectedCategories.length + 1 >= maxCategories && !selectedCategories.includes(categoryId)) {
      onClose()
    }
  }

  const handleRemoveCategory = (categoryId: string) => {
    setValue(fieldName, selectedCategories.filter(id => id !== categoryId) as PathValue<T, Path<T>>, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId)
  }

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  const registerField = register(
    fieldName,
    registerOptions ?? {
      required: t("No categories selected."),
    },
  )

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel>{t("App Categories")}</FormLabel>

      <Text fontSize="xs" color="gray.500" mb={2}>
        {t("Select up to 2 categories that best describe your app.")}
      </Text>

      <input type="hidden" {...registerField} />

      <VStack align="flex-start" spacing={4} width="full">
        <HStack spacing={3} flexWrap="wrap">
          {!!selectedCategories?.length &&
            selectedCategories?.map(categoryId => {
              const category = getCategoryById(categoryId)
              if (!category) return null

              return (
                <Tag
                  key={categoryId}
                  size="lg"
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

          {selectedCategories?.length < maxCategories && (
            <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start" closeOnBlur={true}>
              <PopoverTrigger>
                <Button leftIcon={<FaPlus />} variant="outline" borderRadius="full" size="md">
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
                          bg={selectedCategories?.includes(category.id) ? "blue.50" : "transparent"}
                          _hover={{ bg: "#F5F5F5" }}
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
      </VStack>

      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  )
}

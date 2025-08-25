import {
  VStack,
  Button,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  HStack,
  Badge,
  Box,
  Flex,
  useColorModeValue,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { useAppsWithoutCategories } from "@/hooks/useAppsWithoutCategories"
import { useAdminAssignCategories, AppCategoryAssignment } from "@/hooks/useAdminAssignCategories"
import { APP_CATEGORIES, MAX_CATEGORIES } from "@/types/appDetails"

export const XAppAssignAppCategory = () => {
  const { t } = useTranslation()
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [appCategories, setAppCategories] = useState<Record<string, string[]>>({})

  const { data: appsWithoutCategories, isLoading: isLoadingApps } = useAppsWithoutCategories()

  const { assignCategories, isUploading, uploadError, isTransactionPending } = useAdminAssignCategories({
    onSuccess: () => {
      setAppCategories({})
      setCarouselIndex(0)
    },
    onFailure: () => {},
  })

  const handleToggleCategory = useCallback((appId: string, categoryId: string) => {
    setAppCategories(prev => {
      const currentCategories = prev[appId] || []
      const isSelected = currentCategories.includes(categoryId)

      if (isSelected) {
        return {
          ...prev,
          [appId]: currentCategories.filter(id => id !== categoryId),
        }
      } else if (currentCategories.length < MAX_CATEGORIES) {
        return {
          ...prev,
          [appId]: [...currentCategories, categoryId],
        }
      }

      return prev
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!appsWithoutCategories) return

    const validAssignments: AppCategoryAssignment[] = appsWithoutCategories
      .filter(app => {
        const categories = appCategories[app.id]
        return categories && categories.length > 0
      })
      .map(app => ({
        app,
        selectedCategories: appCategories[app.id]!,
      }))

    if (validAssignments.length === 0) {
      return
    }

    await assignCategories(validAssignments)
  }, [appsWithoutCategories, appCategories, assignCategories])

  const getCategoryById = useCallback((categoryId: string) => {
    return APP_CATEGORIES.find(category => category.id === categoryId)
  }, [])

  const handlePrevious = useCallback(() => {
    if (!appsWithoutCategories) return
    setCarouselIndex(prev => (prev > 0 ? prev - 1 : appsWithoutCategories.length - 1))
  }, [appsWithoutCategories])

  const handleNext = useCallback(() => {
    if (!appsWithoutCategories) return
    setCarouselIndex(prev => (prev < appsWithoutCategories.length - 1 ? prev + 1 : 0))
  }, [appsWithoutCategories])

  const totalAssignments = useMemo(() => {
    return Object.values(appCategories).filter(categories => categories.length > 0).length
  }, [appCategories])

  const isLoading = isLoadingApps || isUploading || isTransactionPending
  const canSubmit = totalAssignments > 0 && !isLoading

  const cardBg = useColorModeValue("white", "#2D2D2F")
  const borderColor = useColorModeValue("#E0E0E0", "#2D2D2F")

  if (isLoadingApps) {
    return (
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Assign App Categories")}</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Spinner size="lg" />
            <Text>{t("Loading apps without categories...")}</Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Assign App Categories")}</Heading>
          <Text fontSize="sm" color="#6A6A6A" mt={2}>
            {t("Maximum {{max}} categories per app.", {
              max: MAX_CATEGORIES,
            })}
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {uploadError && (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{uploadError.message}</AlertDescription>
              </Alert>
            )}

            {!appsWithoutCategories || appsWithoutCategories.length === 0 ? (
              <Alert status="success">
                <AlertIcon />
                <AlertDescription>{t("All apps have categories assigned! 🎉")}</AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {/* Carousel Header */}
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold">
                    {t("Apps without categories: {{count}}", { count: appsWithoutCategories.length })}
                  </Text>
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="#6A6A6A">
                      {carouselIndex + 1} {"/"} {appsWithoutCategories.length}
                    </Text>
                    <IconButton
                      aria-label={t("Previous app")}
                      icon={<FaChevronLeft />}
                      size="sm"
                      variant="outline"
                      onClick={handlePrevious}
                      isDisabled={appsWithoutCategories.length <= 1}
                    />
                    <IconButton
                      aria-label={t("Next app")}
                      icon={<FaChevronRight />}
                      size="sm"
                      variant="outline"
                      onClick={handleNext}
                      isDisabled={appsWithoutCategories.length <= 1}
                    />
                  </HStack>
                </HStack>

                {/* Carousel Container */}
                <Box position="relative" overflow="hidden" borderRadius="md">
                  <Flex transition="transform 0.3s ease" transform={`translateX(-${carouselIndex * 100}%)`}>
                    {appsWithoutCategories.map(app => {
                      const selectedCategories = appCategories[app.id] || []
                      return (
                        <Box
                          key={app.id}
                          minW="100%"
                          p={4}
                          border="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          bg={cardBg}
                          mx={1}>
                          <VStack align="flex-start" spacing={1}>
                            <Text fontWeight="semibold">{app.name}</Text>
                            <Text fontSize="xs" color="black">
                              {app.id}
                            </Text>
                          </VStack>

                          <VStack align="flex-start" spacing={3}>
                            <Text fontSize="sm" fontWeight="medium">
                              {t("Selected Categories ({{count}}/{{max}})", {
                                count: selectedCategories.length,
                                max: MAX_CATEGORIES,
                              })}
                            </Text>

                            <Flex wrap="wrap" gap={2}>
                              {selectedCategories.map(categoryId => {
                                const category = getCategoryById(categoryId)
                                return category ? (
                                  <Tag
                                    key={categoryId}
                                    size="md"
                                    borderRadius="full"
                                    variant="solid"
                                    style={{ backgroundColor: category.color }}
                                    color="black">
                                    <TagLabel>{category.name}</TagLabel>
                                    <TagCloseButton onClick={() => handleToggleCategory(app.id, categoryId)} />
                                  </Tag>
                                ) : null
                              })}
                            </Flex>

                            <Flex wrap="wrap" gap={2}>
                              {APP_CATEGORIES.filter(cat => !selectedCategories.includes(cat.id)).map(category => (
                                <Badge
                                  key={category.id}
                                  cursor="pointer"
                                  onClick={() => handleToggleCategory(app.id, category.id)}
                                  opacity={selectedCategories.length >= MAX_CATEGORIES ? 0.5 : 1}
                                  pointerEvents={selectedCategories.length >= MAX_CATEGORIES ? "none" : "auto"}
                                  style={{ backgroundColor: category.color }}
                                  color="black"
                                  px={2}
                                  py={1}
                                  borderRadius="md">
                                  {"+ "}
                                  {category.name}
                                </Badge>
                              ))}
                            </Flex>
                          </VStack>
                        </Box>
                      )
                    })}
                  </Flex>
                </Box>

                {/* Dots Indicator */}
                {appsWithoutCategories.length > 1 && (
                  <HStack justify="center" spacing={2}>
                    {appsWithoutCategories.map((app, index) => (
                      <Box
                        key={app.id}
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg={index === carouselIndex ? "blue.500" : "gray.300"}
                        cursor="pointer"
                        onClick={() => setCarouselIndex(index)}
                        transition="background-color 0.2s"
                      />
                    ))}
                  </HStack>
                )}

                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isDisabled={!canSubmit}
                  isLoading={isLoading}
                  loadingText={isUploading ? t("Uploading metadata...") : t("Processing transaction...")}
                  size="lg">
                  {t("Assign Categories to {{count}} Apps", { count: totalAssignments })}
                </Button>
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}

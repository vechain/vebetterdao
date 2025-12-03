import {
  VStack,
  Button,
  Heading,
  Text,
  Card,
  Alert,
  Spinner,
  HStack,
  Badge,
  Box,
  Flex,
  Tag,
  IconButton,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"

import { useColorModeValue } from "@/components/ui/color-mode"
import { useAdminAssignCategories, AppCategoryAssignment } from "@/hooks/xApp/useAdminAssignCategories"
import { useAppsWithoutCategories } from "@/hooks/xApp/useAppsWithoutCategories"
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
      .filter((app: any) => {
        const categories = appCategories[app.id]
        return categories && categories.length > 0
      })
      .map((app: any) => ({
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
      <Card.Root w={"full"}>
        <Card.Header>
          <Heading size="lg">{t("Assign App Categories")}</Heading>
        </Card.Header>
        <Card.Body>
          <VStack gap={4}>
            <Spinner size="lg" />
            <Text>{t("Loading apps without categories...")}</Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <>
      <Card.Root w={"full"}>
        <Card.Header>
          <Heading size="lg">{t("Assign App Categories")}</Heading>
          <Text textStyle="sm" color="text.subtle" mt={2}>
            {t("Maximum {{max}} categories per app.", {
              max: MAX_CATEGORIES,
            })}
          </Text>
        </Card.Header>
        <Card.Body>
          <VStack gap={6} align="stretch">
            {uploadError && (
              <Alert.Root status="error">
                <Alert.Indicator />
                <Alert.Description>{uploadError.message}</Alert.Description>
              </Alert.Root>
            )}

            {!appsWithoutCategories || appsWithoutCategories.length === 0 ? (
              <Alert.Root status="success">
                <Alert.Indicator />
                <Alert.Description>{t("All apps have categories assigned! 🎉")}</Alert.Description>
              </Alert.Root>
            ) : (
              <VStack gap={4} align="stretch">
                {/* Carousel Header */}
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold">
                    {t("Apps without categories: {{count}}", { count: appsWithoutCategories.length })}
                  </Text>
                  <HStack gap={2}>
                    <Text textStyle="sm" color="text.subtle">
                      {carouselIndex + 1} {"/"} {appsWithoutCategories.length}
                    </Text>
                    <IconButton
                      aria-label={t("Previous app")}
                      size="sm"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={appsWithoutCategories.length <= 1}>
                      <FaChevronLeft />
                    </IconButton>
                    <IconButton
                      aria-label={t("Next app")}
                      size="sm"
                      variant="outline"
                      onClick={handleNext}
                      disabled={appsWithoutCategories.length <= 1}>
                      <FaChevronRight />
                    </IconButton>
                  </HStack>
                </HStack>

                {/* Carousel Container */}
                <Box position="relative" overflow="hidden" borderRadius="md">
                  <Flex transition="transform 0.3s ease" transform={`translateX(-${carouselIndex * 100}%)`}>
                    {appsWithoutCategories.map((app: any) => {
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
                          <VStack align="flex-start" gap={1}>
                            <Text fontWeight="semibold">{app.name}</Text>
                            <Text textStyle="xs" color="black">
                              {app.id}
                            </Text>
                          </VStack>

                          <VStack align="flex-start" gap={3}>
                            <Text textStyle="sm">
                              {t("Selected Categories ({{count}}/{{max}})", {
                                count: selectedCategories.length,
                                max: MAX_CATEGORIES,
                              })}
                            </Text>

                            <Flex wrap="wrap" gap={2}>
                              {selectedCategories.map(categoryId => {
                                const category = getCategoryById(categoryId)
                                return category ? (
                                  <Tag.Root
                                    key={categoryId}
                                    borderRadius="full"
                                    style={{ backgroundColor: category.color }}>
                                    <Tag.Label>{category.name}</Tag.Label>
                                    <Tag.CloseTrigger onClick={() => handleToggleCategory(app.id, categoryId)} />
                                  </Tag.Root>
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
                  <HStack justify="center" gap={2}>
                    {appsWithoutCategories.map((app: any, index: number) => (
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
                  colorPalette="blue"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  loading={isLoading}
                  loadingText={isUploading ? t("Uploading metadata...") : t("Processing transaction...")}>
                  {t("Assign Categories to {{count}} Apps", { count: totalAssignments })}
                </Button>
              </VStack>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    </>
  )
}

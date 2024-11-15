import { OkHandIcon } from "@/components"
import { VStack, Card, CardBody, Heading, List, ListItem, ListIcon } from "@chakra-ui/react"
import { UilCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const AppsEmptyState = () => {
  const { t } = useTranslation()

  return (
    <Card w="full">
      <CardBody>
        <VStack align={"center"} justify={"center"} w="full" minH="400px">
          <OkHandIcon color="#757575" size={200} />
          <Heading textAlign={"center"}>{t("No results found")}</Heading>
          <List spacing={1} textAlign="center" mt={2}>
            <ListItem display="flex" alignItems="center" fontSize="16px" color="#757575">
              <ListIcon as={UilCircle} color="#757575" boxSize={3} />
              {t("Try changing the filter")}
            </ListItem>
          </List>
        </VStack>
      </CardBody>
    </Card>
  )
}

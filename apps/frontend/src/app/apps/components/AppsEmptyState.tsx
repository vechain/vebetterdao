import { VStack, Card, Heading, List } from "@chakra-ui/react"
import { UilCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { OkHandIcon } from "../../../components/Icons/OkHandIcon"

export const AppsEmptyState = () => {
  const { t } = useTranslation()
  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align={"center"} justify={"center"} w="full" minH="400px">
          <OkHandIcon color="#757575" size={200} />
          <Heading textAlign={"center"}>{t("No results found")}</Heading>
          <List.Root gap={1} textAlign="center" mt={2}>
            <List.Item display="flex" alignItems="center" textStyle="md" color="#757575">
              <List.Indicator asChild>
                <UilCircle color="#757575" size={3} />
              </List.Indicator>
              {t("Try changing the filter")}
            </List.Item>
          </List.Root>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

import { useTranslation } from "react-i18next"
import {
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  CardHeader,
  CardBody,
  Card,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { BsChevronRight } from "react-icons/bs"
import { GrantsNewFormStepCard } from "./form"

//TODO: Move to common component
const BreadcrumbOverview = () => {
  const { t } = useTranslation()

  return (
    <Breadcrumb spacing={2} fontSize="lg" separator={<BsChevronRight size={16} />}>
      <BreadcrumbItem>
        <BreadcrumbLink href="/proposals/grants">
          <Text fontWeight="bold" color="#747C89">
            {t("Governance")}
          </Text>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink href="#">
          <Text fontWeight="bold">{t("Apply for grant")}</Text>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}

export const GrantsNewPageContent = () => {
  const { t } = useTranslation()

  return (
    <VStack w="full" spacing={8} pb={8} align="flex-start">
      <BreadcrumbOverview />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <GrantsNewFormStepCard />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Card variant="base">
            <CardHeader>
              <Text fontWeight="bold">{t("Apply for grant")}</Text>
            </CardHeader>
            <CardBody>
              <Text>{t("Apply for grant")}</Text>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  )
}

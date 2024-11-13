import { Card, CardBody, VStack, Image, Heading, Button } from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

export const AddNewAppCard = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/new`)
  }

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      h={"full"}
      style={{
        backgroundImage: "./images/mascote/mascote-welcoming-left.png",
        borderRadius: "20px",
      }}>
      <CardBody>
        <VStack spacing={8} align="center" h="full" justify={"center"} textAlign={"center"}>
          <Image src="/images/hand-plant.svg" boxSize={32} alt="Add new App image" />
          <Heading size="md">{t("Do you have an app to join the VeBetter DAO ecosystem?")}</Heading>
          <Button variant="primaryAction" onClick={navigateToAppDetail} leftIcon={<FaPlus />}>
            {t("Apply now")}
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}

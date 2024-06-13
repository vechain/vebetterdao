import { Card, CardBody, VStack, Image, Heading, Button } from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const AddNewAppCard = () => {
  const { t } = useTranslation()

  // const router = useRouter()
  // const navigateToAppDetail = () => {
  //   router.push(`/apps/new`)
  // }

  const openGrantPage = () => {
    window.open("https://vechain.org/grants/", "_blank")
  }

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      h={"full"}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
        borderRadius: "20px",
      }}>
      <CardBody>
        <VStack spacing={8} align="center" h="full" justify={"center"} textAlign={"center"}>
          <Image src="/images/hand-plant.svg" boxSize={32} alt="Add new App image" />
          <Heading size="md">{t("Do you have a dApp to join the VeBetter DAO ecosystem?")}</Heading>
          <Button colorScheme="blue" onClick={openGrantPage} rounded={"full"} leftIcon={<FaPlus />}>
            {t("Apply now")}
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}

import { Card, Text, Stack, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsBanner = () => {
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { t } = useTranslation()
  return (
    <Card
      bg="#004CFC"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage={"/images/cloud-background.png"}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      w="full">
      <Stack justify={"space-between"} direction={isAbove1200 ? "row" : "column"} align="center" gap="24px">
        <Stack direction={isAbove1200 ? "row" : "column"} gap="24px" align="center">
          {/* TODO temp image till mascot release */}
          <svg width="116" height="116" viewBox="0 0 116 116" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.2031 35.2256V52.1176C11.2031 56.0936 14.4271 59.3176 18.4031 59.3176H53.5631C57.5391 59.3176 60.7631 56.0936 60.7631 52.1176V26.1976H21.8471C20.2271 26.1496 18.5631 25.5696 17.3391 24.4336C15.2471 22.4856 14.9431 18.8456 16.3711 16.3056C17.7991 13.7616 20.6592 12.3536 23.4312 12.4016C26.2072 12.4496 28.5871 14.1536 30.9671 15.7416C38.9551 21.0736 38.6951 23.6496 37.5351 24.8016C36.7471 25.5856 35.5031 25.6896 34.5391 25.1336C33.0111 24.2496 31.9711 21.8816 40.9591 15.7416C43.3191 14.1296 45.7191 12.4496 48.4951 12.4016C51.2711 12.3536 54.1271 13.7616 55.5551 16.3056C56.9831 18.8496 56.6791 22.4896 54.5871 24.4336C53.3631 25.5736 51.7032 26.1496 50.0792 26.1976C50.0792 26.1976 35.9071 27.3976 35.9071 50.7976"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <Stack align="stretch">
            <Text fontSize="2xl" fontWeight={600} align={isAbove1200 ? "left" : "center"}>
              {t("Explore apps")}
            </Text>
            <Text align={isAbove1200 ? "left" : "center"}>
              {t("Browse and discover dApps where you can earn tokens for sustainable actions.")}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}

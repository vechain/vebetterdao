import { Card, Text, Stack, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsBanner = () => {
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { t } = useTranslation()
  return (
    <Card
      bg="#004CFC"
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
          <svg width="75" height="70" viewBox="0 0 130 123" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 60.063V102.293C3 112.233 11.06 120.293 21 120.293H108.9C118.84 120.293 126.9 112.233 126.9 102.293V37.493H29.61C25.56 37.373 21.4 35.923 18.34 33.083C13.11 28.213 12.35 19.113 15.92 12.763C19.49 6.40298 26.6401 2.88297 33.5701 3.00297C40.5101 3.12297 46.46 7.38298 52.41 11.353C72.38 24.683 71.73 31.123 68.83 34.003C66.86 35.963 63.75 36.223 61.34 34.833C57.52 32.623 54.92 26.703 77.39 11.353C83.29 7.32298 89.29 3.12297 96.23 3.00297C103.17 2.88297 110.31 6.40298 113.88 12.763C117.45 19.123 116.69 28.223 111.46 33.083C108.4 35.933 104.25 37.373 100.19 37.493C100.19 37.493 64.76 40.493 64.76 98.993"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <Stack align="stretch">
            <Text fontSize="2xl" fontWeight={600} align={isAbove1200 ? "left" : "center"}>
              {t("Explore apps")}
            </Text>
            <Text align={isAbove1200 ? "left" : "center"}>
              {t("Explore and discover apps that reward you for engaging in sustainable actions.")}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}

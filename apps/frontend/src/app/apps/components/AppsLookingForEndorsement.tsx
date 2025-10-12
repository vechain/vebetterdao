import React from "react"
import { VStack, HStack, Heading, Text, IconButton, Card, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UnendorsedApp } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Navigation } from "swiper/modules"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import "swiper/css"
import "swiper/css/navigation"
import "@/app/theme/swiper-custom.css"

type Props = {
  filteredApps: UnendorsedApp[]
}

export const AppsLookingForEndorsement = ({ filteredApps }: Props) => {
  const { t } = useTranslation()

  return (
    <Card.Root w="full" variant="primary">
      <Card.Body gap={4}>
        <HStack justifyContent={"space-between"} alignItems={"center"} w={"full"}>
          <VStack alignItems={"flex-start"} gap={0}>
            <Heading size={{ base: "xl", md: "2xl" }}>{t("New apps looking for endorsement")}</Heading>
            <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
              {t("These apps need to get enough endorsement score to become active")}
            </Text>
          </VStack>
        </HStack>

        <Box position="relative">
          <Swiper
            modules={[A11y, Navigation]}
            spaceBetween={20}
            slidesPerView={1.1}
            breakpoints={{
              1150: {
                slidesPerView: 2.1,
              },
            }}
            pagination={{ clickable: true }}
            scrollbar={{ draggable: true }}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              // overflow: "hidden",
              display: "flex",
            }}
            navigation={{
              nextEl: ".custom-swiper-button-next",
              prevEl: ".custom-swiper-button-prev",
            }}>
            {filteredApps.map(xApp => (
              <SwiperSlide
                key={xApp.id}
                style={{
                  display: "flex",
                  width: "100%",
                  position: "relative",
                  opacity: 1,
                }}>
                <UnendorsedAppCard appId={xApp.id} isNewApp={xApp.isNew} />
              </SwiperSlide>
            ))}
          </Swiper>

          <IconButton
            hideBelow="md"
            className="custom-swiper-button-prev"
            pos={"absolute"}
            zIndex={2}
            rounded="full"
            left={0}
            top={"50%"}
            transform={"translate(-50%, -50%)"}
            aria-label="Previous app">
            <FaArrowLeft />
          </IconButton>
          <IconButton
            hideBelow="md"
            className="custom-swiper-button-next"
            pos={"absolute"}
            zIndex={2}
            rounded="full"
            right={0}
            top={"50%"}
            transform={"translate(50%, -50%)"}
            aria-label="Next app">
            <FaArrowRight />
          </IconButton>
        </Box>
      </Card.Body>
    </Card.Root>
  )
}

import React, { useRef } from "react"
import { VStack, HStack, Heading, Text, IconButton, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UnendorsedApp } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react"
import { A11y } from "swiper/modules"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
import "swiper/css"
import "@/app/theme/swiper-custom.css"

type Props = {
  filteredApps: UnendorsedApp[]
}

export const AppsLookingForEndorsement = ({ filteredApps }: Props) => {
  const { t } = useTranslation()
  const swiperRef = useRef<SwiperClass | null>(null)

  const swiperStyle = useBreakpointValue({
    base: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      display: "flex",
    },
    md: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      display: "flex",
      paddingLeft: "80px",
      paddingRight: "80px",
    },
  })

  return (
    <VStack
      alignItems="flex-start"
      gap={4}
      p={"20px"}
      width={"full"}
      border={"1px solid #EFEFEF"}
      borderRadius={"20px"}
      bgColor={"#FFFFFF"}
      boxShadow="0px 8px 16px 0px #00000014"
      _dark={{
        borderColor: "#2D2D2F",
        bgColor: "#1A1A1A",
        boxShadow: "0px 8px 16px 0px #00000029",
      }}>
      <HStack justifyContent={"space-between"} alignItems={"center"} w={"full"}>
        <VStack alignItems={"flex-start"}>
          <Heading size="lg" color="gray.900" _dark={{ color: "#E4E4E4" }}>
            {t("New apps looking for endorsement")}
          </Heading>
          <Text color="gray.600" _dark={{ color: "#A1A1A1" }}>
            {t("These apps need to get enough endorsement score to become active")}
          </Text>
        </VStack>
      </HStack>
      <Swiper
        modules={[A11y]}
        spaceBetween={20}
        slidesPerView={1.1}
        breakpoints={{
          1150: {
            slidesPerView: 2.1,
          },
        }}
        navigation={false}
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        onSwiper={swiper => (swiperRef.current = swiper)}
        style={swiperStyle as any}>
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

        <IconButton
          hideBelow="md"
          pos={"absolute"}
          zIndex={2}
          variant={"primarySubtle"}
          left={5}
          top={"50%"}
          transform={"translateY(-50%)"}
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Previous app">
          <FaChevronLeft />
        </IconButton>
        <IconButton
          hideBelow="md"
          pos={"absolute"}
          zIndex={2}
          variant={"primarySubtle"}
          right={5}
          top={"50%"}
          transform={"translateY(-50%)"}
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next app">
          <FaChevronRight />
        </IconButton>
      </Swiper>
    </VStack>
  )
}

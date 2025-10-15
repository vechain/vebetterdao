import { Box, useMediaQuery, chakra } from "@chakra-ui/react"
import { PropsWithChildren } from "react"

export const BalancePill = ({ variant, children }: PropsWithChildren<{ variant: "b3tr" | "vot3" }>) => {
  const [isDesktop] = useMediaQuery(["(min-width: 1060px)"])
  const fill = variant === "b3tr" ? "actions.primary.default" : "brand.secondary"
  const pillHeight = isDesktop ? "34px" : "26px"
  return (
    <Box position="relative" height={pillHeight} display="flex" alignItems="center" bg={fill} m="0 1rem">
      {variant === "b3tr" ? (
        <chakra.svg
          pos="absolute"
          left="1px"
          transform="translateX(-100%)"
          width="auto"
          height={pillHeight}
          viewBox="0 0 19 34"
          preserveAspectRatio="none"
          fill={fill}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M0 17C0 7.8873 7.3873 0 16.5 0H19V34H16.5C7.3873 34 0 26.1127 0 17Z" />
        </chakra.svg>
      ) : (
        <chakra.svg
          pos="absolute"
          left="1px"
          transform="translateX(-100%)"
          width="auto"
          height={pillHeight}
          viewBox="0 0 16 34"
          preserveAspectRatio="none"
          fill={fill}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M7.94954 6C9.18055 2.61473 12.3979 0 16 0V34H6.5662C2.40241 34 -0.495506 29.8626 0.927439 25.9495L7.94954 6Z" />
        </chakra.svg>
      )}
      {children}
      {variant === "b3tr" ? (
        <chakra.svg
          pos="absolute"
          right="1px"
          transform="translateX(100%)"
          width="auto"
          height={pillHeight}
          viewBox="0 0 16 34"
          preserveAspectRatio="none"
          fill={fill}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M8.05046 27.8612C6.81945 31.2465 3.60214 34 0 34V0H9.4338C13.5976 0 16.4955 4.63736 15.0726 8.55046L8.05046 27.8612Z" />
        </chakra.svg>
      ) : (
        <chakra.svg
          pos="absolute"
          right="1px"
          transform="translateX(100%)"
          width="auto"
          height={pillHeight}
          viewBox="0 0 18 34"
          preserveAspectRatio="none"
          fill={fill}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M18 17C18 7.8873 10.6127 0 1.5 0H0V34H1.5C10.6127 34 18 26.1127 18 17Z" />
        </chakra.svg>
      )}
    </Box>
  )
}

import { Box, Image } from "@chakra-ui/react"

import { AnimatedStar } from "./AnimatedStar"

type Props = {
  image: string
  tokenID?: string
}
export const NFTWithRings = ({ image, tokenID }: Props) => {
  return (
    <Box
      bgGradient={
        "linear-gradient(137deg, rgba(178, 242, 109, 0.2) 2.2%, rgba(0, 76, 252, 0.2) 98.29%), linear-gradient(137deg, rgba(178, 242, 109, 0.2) 2.2%, rgba(0, 76, 252, 0.2) 98.29%)"
      }
      p={7}
      rounded={34}
      position={"relative"}>
      <AnimatedStar
        size={20}
        duration={8}
        scaleMin={1}
        scaleMax={1.5}
        moveAmplitudeX={20}
        moveAmplitudeY={10}
        top={"30%"}
      />
      <AnimatedStar
        size={10}
        duration={6}
        scaleMin={1}
        scaleMax={2}
        moveAmplitudeX={10}
        moveAmplitudeY={20}
        right={"30%"}
        bottom={10}
      />
      <AnimatedStar
        size={16}
        duration={6}
        scaleMin={1}
        scaleMax={1.5}
        moveAmplitudeX={10}
        moveAmplitudeY={10}
        right={40}
        top={"30%"}
      />
      <AnimatedStar
        size={30}
        duration={8}
        scaleMin={1}
        scaleMax={2}
        moveAmplitudeX={4}
        moveAmplitudeY={2}
        right={-10}
        top={-10}
      />
      <AnimatedStar
        size={25}
        duration={12}
        scaleMin={1}
        scaleMax={2}
        moveAmplitudeX={10}
        moveAmplitudeY={2}
        right={-20}
        bottom={20}
      />
      <AnimatedStar
        size={25}
        duration={10}
        scaleMin={1}
        scaleMax={1.5}
        moveAmplitudeX={5}
        moveAmplitudeY={2}
        left={-20}
        top={-20}
      />
      <AnimatedStar
        size={18}
        duration={8}
        scaleMin={1}
        scaleMax={1.5}
        moveAmplitudeX={5}
        moveAmplitudeY={2}
        left={-30}
        bottom={20}
      />

      <Box
        bgGradient={
          "linear-gradient(137deg, rgba(178, 242, 109, 0.6) 2.2%, rgba(0, 76, 252, 0.6) 98.29%), linear-gradient(137deg, rgba(178, 242, 109, 0.6) 2.2%, rgba(0, 76, 252, 0.6) 98.29%)"
        }
        p={7}
        rounded={34}>
        <Box bgGradient={"linear-gradient(137deg, #B2F26D 2.2%, #004CFC 98.29%)"} p={5} rounded={34}>
          <Box bg={"#0B0D0C"} p={3} rounded={34}>
            <Image src={image} maxW={"auto"} rounded={34} alt={`GM Earth NFT #${tokenID}`} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

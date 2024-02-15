import { useTokenColors } from "@/hooks"
import {
  Slider,
  SliderFilledTrack,
  SliderProps,
  SliderThumb,
  SliderTrack,
  Tooltip,
  useColorModeValue,
  useToken,
} from "@chakra-ui/react"
import { useState } from "react"

type Props = SliderProps & { tooltipLabel?: string }
export const SliderWithTooltip: React.FC<Props> = ({ tooltipLabel, ...props }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const { b3trColor, vot3Color } = useTokenColors()
  return (
    <Slider
      id="slider"
      defaultValue={5}
      min={0}
      max={100}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      {...props}>
      <SliderTrack bg={vot3Color}>
        <SliderFilledTrack bg={b3trColor} />
      </SliderTrack>
      <Tooltip hasArrow bg="teal.500" color="white" placement="top" isOpen={showTooltip} label={tooltipLabel}>
        <SliderThumb />
      </Tooltip>
    </Slider>
  )
}

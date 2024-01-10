import { Slider, SliderFilledTrack, SliderProps, SliderThumb, SliderTrack, Tooltip } from "@chakra-ui/react"
import { useState } from "react"

type Props = SliderProps & { tooltipLabel?: string }
export const SliderWithTooltip: React.FC<Props> = ({ tooltipLabel, ...props }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <Slider
      id="slider"
      defaultValue={5}
      min={0}
      max={100}
      colorScheme="teal"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      {...props}>
      <SliderTrack>
        <SliderFilledTrack />
      </SliderTrack>
      <Tooltip hasArrow bg="teal.500" color="white" placement="top" isOpen={showTooltip} label={tooltipLabel}>
        <SliderThumb />
      </Tooltip>
    </Slider>
  )
}

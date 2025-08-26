import { useState } from "react"
import { Slider, SliderRootProps } from "@chakra-ui/react"
import { useTokenColors } from "@/hooks"
import { Tooltip } from "./ui/tooltip"

type Props = SliderRootProps & { tooltipLabel?: string }

export const SliderWithTooltip: React.FC<Props> = ({ tooltipLabel, ...props }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const { b3trColor, vot3Color } = useTokenColors()
  return (
    <Slider.Root
      id="slider"
      defaultValue={[5]}
      min={0}
      max={100}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      {...props}>
      <Slider.Control>
        <Slider.Track bg={vot3Color}>
          <Slider.Range bg={b3trColor} />
        </Slider.Track>

        <Slider.Thumb index={0}>
          <Tooltip
            showArrow
            contentProps={{ css: { "--tooltip-bg": "colors.teal.500" } }}
            positioning={{ placement: "top" }}
            open={showTooltip}
            content={tooltipLabel}>
            <Slider.DraggingIndicator />
          </Tooltip>
        </Slider.Thumb>
      </Slider.Control>
    </Slider.Root>
  )
}

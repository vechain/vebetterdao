import { AbsoluteCenter } from "@chakra-ui/react"
import React, { memo } from "react"

export type ProgressRingProps = {
  /** 0..100 */
  percent: number

  bgColor?: string
  fgColor?: string

  /** size in px */
  size?: number
  /** ring stroke width in px */
  strokeWidth?: number

  label?: React.ReactNode

  /** start at 12 o'clock by default */
  startAngle?: number
  roundedCaps?: boolean

  className?: string
  style?: React.CSSProperties
}

export const ProgressRing = memo(function ProgressRing({
  percent,
  bgColor = "#047229",
  fgColor = "#99E0B1",
  size = 70,
  strokeWidth = 8,
  label,
  startAngle = -90,
  roundedCaps = true,
  className,
  style,
}: ProgressRingProps) {
  const p = Math.max(0, Math.min(100, percent))

  // Use a viewBox-based radius and scale to requested size
  const vb = 70
  const cx = vb / 2
  const cy = vb / 2
  const r = 31 // matches your original
  const circumference = 2 * Math.PI * r

  const dash = (p / 100) * circumference
  const gap = circumference - dash

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-block",
        ...style,
      }}>
      <svg width={size} height={size} viewBox="0 0 70 70" fill="none">
        {/* base ring */}
        <circle cx={cx} cy={cy} r={r} stroke={bgColor} strokeWidth={strokeWidth} />

        {/* foreground progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={fgColor}
          strokeWidth={strokeWidth}
          strokeLinecap={roundedCaps ? "round" : "butt"}
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(${startAngle} ${cx} ${cy})`}
          fill="none"
        />
      </svg>

      <AbsoluteCenter>{label}</AbsoluteCenter>
    </div>
  )
})

// https://github.com/Gamote/lottie-react/issues/101
import dynamic from "next/dynamic"
import { ComponentType } from "react"

// Type definition for react-lottie props
interface LottieProps {
  options: {
    loop?: boolean
    autoplay?: boolean
    animationData: any
    rendererSettings?: any
  }
  height?: number | string
  width?: number | string
  speed?: number
  style?: React.CSSProperties
}

const LazyLottie = dynamic(
  () =>
    import("react-lottie").then(mod => ({ default: mod.default })) as Promise<{ default: ComponentType<LottieProps> }>,
  { ssr: false },
)

export default LazyLottie

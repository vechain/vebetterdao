// https://github.com/Gamote/lottie-react/issues/101
import dynamic from "next/dynamic"

const LazyLottie = dynamic(() => import("react-lottie"), { ssr: false })

export default LazyLottie

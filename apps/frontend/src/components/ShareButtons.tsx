import { HStack } from "@chakra-ui/react"
import { motion } from "framer-motion"
import {
  FacebookIcon,
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share"

// bouncing circle button animation provider
const BouncingAnimation = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    transition={{
      duration: 0.5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: Math.random() * 5,
    }}
    animate={{
      y: [0, -2, 0],
      rotate: [0, 10, -10, 0],
    }}>
    {children}
  </motion.div>
)

export const ShareButtons = ({
  description,
  url = window.location.href,
  facebookHashtag,
}: {
  description: string
  url?: string
  facebookHashtag?: string
}) => {
  return (
    <HStack gap={2}>
      <BouncingAnimation>
        <TwitterShareButton title={description} url={url}>
          <TwitterIcon size={32} round />
        </TwitterShareButton>
      </BouncingAnimation>
      <BouncingAnimation>
        <FacebookShareButton hashtag={facebookHashtag ?? `#${description.split(" ").join("_")}`} url={url}>
          <FacebookIcon size={32} round />
        </FacebookShareButton>
      </BouncingAnimation>
      <BouncingAnimation>
        <WhatsappShareButton title={description} url={url}>
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>
      </BouncingAnimation>
    </HStack>
  )
}

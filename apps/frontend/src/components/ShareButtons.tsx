import { HStack } from "@chakra-ui/react"
import {
  FacebookIcon,
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share"

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
      <TwitterShareButton title={description} url={url}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>
      <FacebookShareButton hashtag={facebookHashtag ?? `#${description.split(" ").join("_")}`} url={url}>
        <FacebookIcon size={32} round />
      </FacebookShareButton>
      <WhatsappShareButton title={description} url={url}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
    </HStack>
  )
}

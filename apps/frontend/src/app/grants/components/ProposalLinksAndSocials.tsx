import { HStack, Icon } from "@chakra-ui/react"
import { UilGithub } from "@iconscout/react-unicons"
import { Discord, X } from "iconoir-react"

import { GrantDetail } from "../types"

export const ProposalLinksAndSocials = ({ proposal }: { proposal: GrantDetail }) => {
  const twitterUsername = proposal?.metadata?.twitterUsername
  const discordUsername = proposal?.metadata?.discordUsername
  const githubUsername = proposal?.metadata?.githubUsername

  if (!twitterUsername && !discordUsername && !githubUsername) return null

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation() // Prevent card click
    window.open(url, "_blank")
  }
  return (
    <HStack gap={"16px"} color="icon.subtle">
      {twitterUsername ? (
        <Icon
          as={X}
          boxSize={5}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://x.com/${twitterUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
      {discordUsername ? (
        <Icon
          as={Discord}
          boxSize={5}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://discord.com/users/${discordUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
      {githubUsername ? (
        <Icon
          as={UilGithub}
          boxSize={5}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://github.com/${githubUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
    </HStack>
  )
}

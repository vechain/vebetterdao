import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { HStack, Icon } from "@chakra-ui/react"
import { Discord, X } from "iconoir-react"
import { UilGithub } from "@iconscout/react-unicons"

export const ProposalLinksAndSocials = ({ proposal }: { proposal: GrantProposalEnriched }) => {
  const hasTwitter = proposal?.twitterUsername
  const hasDiscord = proposal?.discordUsername
  const hasGithub = proposal?.githubUsername
  if (!hasTwitter && !hasDiscord && !hasGithub) return null

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation() // Prevent card click
    window.open(url, "_blank")
  }

  return (
    <HStack gap={"16px"} color="icon.subtle">
      {/* <Icon as={LiaDiscourse} onClick={(e) => handleLinkClick(e, discourseUrl)} cursor="pointer" /> */}
      {hasTwitter ? (
        <Icon
          as={X}
          boxSize={5}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://x.com/${proposal.twitterUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
      {hasDiscord ? (
        <Icon
          as={Discord}
          boxSize={5}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://discord.com/users/${proposal.discordUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
      {hasGithub ? (
        <Icon
          as={UilGithub}
          boxSize={5}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://github.com/${proposal.githubUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
    </HStack>
  )
}

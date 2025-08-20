import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { HStack, Icon } from "@chakra-ui/react"
import { FaXTwitter } from "react-icons/fa6"
import { AiOutlineDiscord } from "react-icons/ai"
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
    <HStack fontSize={{ base: "14px", md: "20px" }} gap={"16px"}>
      {/* <Icon as={LiaDiscourse} onClick={(e) => handleLinkClick(e, discourseUrl)} cursor="pointer" /> */}
      {hasTwitter ? (
        <Icon
          as={FaXTwitter}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://x.com/${proposal.twitterUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
      {hasDiscord ? (
        <Icon
          as={AiOutlineDiscord}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://discord.com/users/${proposal.discordUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
      {hasGithub ? (
        <Icon
          as={UilGithub}
          cursor="pointer"
          onClick={e => handleLinkClick(e, `https://github.com/${proposal.githubUsername}`)}
          _hover={{ opacity: 0.7 }}
        />
      ) : null}
    </HStack>
  )
}

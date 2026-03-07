"use client"

import { Button, Card, Code, Heading, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { LuArrowLeft, LuCoins, LuExternalLink, LuScale, LuServer, LuZap } from "react-icons/lu"

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }}>
      <VStack align="start" gap="3">
        <HStack gap="3" align="center">
          <Text
            textStyle="sm"
            fontWeight="bold"
            color="actions.primary.text"
            bg="actions.primary.default"
            rounded="full"
            w="7"
            h="7"
            display="flex"
            alignItems="center"
            justifyContent="center">
            {number}
          </Text>
          <Text textStyle={{ base: "md", md: "lg" }} fontWeight="semibold">
            {title}
          </Text>
        </HStack>
        <VStack align="start" gap="2" pl="10">
          {children}
        </VStack>
      </VStack>
    </Card.Root>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <Code display="block" whiteSpace="pre" p="3" rounded="lg" w="full" textStyle="sm" overflowX="auto" bg="bg.tertiary">
      {children}
    </Code>
  )
}

export function SetupGuide() {
  return (
    <VStack align="start" gap="6" w="full">
      <HStack gap="3" align="center">
        <NextLink href="/">
          <Button variant="ghost" size="sm" rounded="full">
            <Icon>
              <LuArrowLeft />
            </Icon>
            {"Back"}
          </Button>
        </NextLink>
      </HStack>

      <VStack align="start" gap="1">
        <Heading size={{ base: "xl", md: "2xl" }} fontWeight="bold">
          {"Relayer Setup Guide"}
        </Heading>
        <Text textStyle="md" color="text.subtle">
          {"Set up and run your own relayer node to earn B3TR rewards."}
        </Text>
      </VStack>

      <Card.Root variant="primary" p={{ base: "5", md: "8" }} w="full">
        <VStack gap={6} align="stretch">
          <VStack gap={2} align="start">
            <Heading size="lg" fontWeight="bold">
              {"What Are Relayers?"}
            </Heading>
            <Text color="text.subtle">
              {
                "Relayers are services that cast votes and claim rewards for users who enabled auto-voting. Anyone can run one — apps, community members, developers. You earn a share of rewards for the work you do."
              }
            </Text>
          </VStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuZap />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"What You Do"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "You run a relayer node that watches the blockchain. When a new round starts, it sees who has auto-voting enabled, submits their votes, and claims their rewards in batches. It loops every few minutes until everyone is served."
                }
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuCoins />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"How You Earn"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Each user you serve pays 10% of their weekly rewards (max 100 B3TR) into a shared pool. At the end of the week, the pool is split among relayers based on work done. Voting earns 3 points, claiming earns 1 point — more points, bigger share."
                }
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuServer />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"What You Need"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "A wallet with some VTHO for gas, the relayer node software, and a connection to a VeChain Thor node. You can run it locally, on a server, or in Docker."
                }
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} align="start">
            <Icon color="text.subtle" mt={1} flexShrink={0}>
              <LuScale />
            </Icon>
            <VStack gap={1} align="start">
              <Text fontWeight="semibold">{"The Rules"}</Text>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Every user must be served. If even one gets missed, nobody gets paid — the whole pool stays locked. It's first-come-first-served: if another relayer handles a user before you, you get nothing for that user. After the round is fully complete, you claim your share."
                }
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Root>

      <VStack align="start" gap="4" w="full">
        <Step number={1} title="Prerequisites">
          <Text textStyle="sm" color="text.subtle">
            {
              "You need a VeChain wallet with some VTHO for gas fees. The relayer node requires Node.js 18+ and a registered relayer address (currently admin-registered during MVP)."
            }
          </Text>
          <Text textStyle="sm" color="text.subtle">
            {"Contact the VeBetterDAO team to get your address registered as a relayer."}
          </Text>
        </Step>

        <Step number={2} title="Clone the relayer node">
          <Text textStyle="sm" color="text.subtle">
            {"The relayer node is a standalone CLI tool with no monorepo dependency."}
          </Text>
          <CodeBlock>
            {"git clone https://github.com/vechain/vebetterdao-contracts\ncd relayer-node\nyarn install"}
          </CodeBlock>
        </Step>

        <Step number={3} title="Configure environment">
          <Text textStyle="sm" color="text.subtle">
            {"Create a .env file with your relayer wallet credentials and network configuration."}
          </Text>
          <CodeBlock>
            {
              '# Use mnemonic OR private key (not both)\nMNEMONIC="your twelve word mnemonic phrase here"\n# RELAYER_PRIVATE_KEY="0x..."\n\n# Network: mainnet or testnet-staging\nRELAYER_NETWORK=mainnet\n\n# Optional: run once then exit (useful for cron)\n# RUN_ONCE=true\n\n# Optional: simulate without sending transactions\n# DRY_RUN=true'
            }
          </CodeBlock>
        </Step>

        <Step number={4} title="Run the node">
          <Text textStyle="sm" color="text.subtle">
            {
              "Start the relayer node. It will automatically discover auto-voting users, batch votes and claims, and loop every 5 minutes."
            }
          </Text>
          <CodeBlock>{"yarn start"}</CodeBlock>
          <Text textStyle="sm" color="text.subtle">
            {
              "The node will: discover users from on-chain events, filter already-voted users, batch execute castVoteOnBehalfOf, batch execute claimReward, then wait 5 minutes before repeating."
            }
          </Text>
        </Step>

        <Step number={5} title="Earn rewards">
          <Text textStyle="sm" color="text.subtle">
            {
              "Relayers earn weighted points for each action: 3 points per vote, 1 point per claim. After ALL users in a round are served, relayers can claim their proportional share from the RelayerRewardsPool."
            }
          </Text>
          <Text textStyle="sm" color="text.subtle">
            {
              "Fee structure: 10% of user rewards (max 100 B3TR per user per round). Gas cost per user is ~0.11 B3TR equivalent, so the margin is substantial."
            }
          </Text>
        </Step>
      </VStack>

      <Card.Root variant="primary" p={{ base: "4", md: "6" }} w="full">
        <HStack justify="space-between" align="center" flexWrap="wrap" gap="3">
          <VStack align="start" gap="1">
            <Text textStyle="md" fontWeight="semibold">
              {"Need more details?"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"Check the full documentation for advanced configuration and troubleshooting."}
            </Text>
          </VStack>
          <Link href="https://docs.vebetterdao.org/vebetter/automation" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" rounded="full">
              {"Full Documentation"}
              <Icon>
                <LuExternalLink />
              </Icon>
            </Button>
          </Link>
        </HStack>
      </Card.Root>
    </VStack>
  )
}

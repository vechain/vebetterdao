"use client"

import { Heading, HStack, Icon, Link, Separator, Tabs, Text, VStack } from "@chakra-ui/react"
import { LuCode, LuRadar } from "react-icons/lu"

function B3trIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 1578.5 1578.5" fill="currentColor" {...props}>
      <path d="M812.4,1299.5c-28.1,0-54.7-16.8-65.9-44.5-14.6-36.3,3-77.7,39.3-92.3,111.6-44.9,203.2-104.5,264.9-172.6,48.5-53.4,77-109.9,80.2-159.1,1.6-24.2-2.4-56.3-30.7-72.4-39.9-22.5-127.8-15-254.9,73.6-30.5,21.3-72.1,15.4-95.6-13.4-23.4-28.8-20.7-70.8,6.3-96.3,62.7-59.3,108.4-114,135.8-162.6,19-33.7,28.9-64.1,28.4-87.9-.4-17.1-6-30.5-16.7-39.9-20.3-17.7-64-14.4-93.5,7.2-32,23.3-56.6,64.4-75.2,125.4-37.2,121.8-132.8,434.8-132.8,434.8-9.5,31-38.4,53.2-70.9,51.6-32.2-1.5-58.9-23-65.6-54.5-3.2-10.2-34.9-101-207.1-377.2-20.7-33.3-10.6-77,22.7-97.7,33.3-20.7,77-10.6,97.7,22.7,62.9,100.9,108.3,179,141,238.7,28.3-92.7,61-199.6,79.4-259.8,27.9-91.5,69.6-156.4,127.3-198.6,37.7-27.5,84.3-43.7,131.2-45.7,53.1-2.2,102.5,14.2,139.3,46.2,40.9,35.7,64.1,86.9,65.3,144,.9,43.2-10.8,89.5-34.7,138,53.6-4.3,102.3,5.1,142.6,27.9,70,39.5,108.4,116.2,102.5,205.2-5.3,81-46.8,168.1-116.8,245.1-76.1,83.8-185.7,156-317,208.8-8.7,3.5-17.7,5.1-26.5,5.1h0c0,0,0,0,0,0Z" />
    </svg>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <VStack align="start" gap={2}>
      <Heading size="md" fontWeight="bold">
        {title}
      </Heading>
      {children}
    </VStack>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <VStack align="start" gap={1} pl={4}>
      {items.map(item => (
        <Text key={item} textStyle="sm" color="text.subtle">
          {`\u2022 ${item}`}
        </Text>
      ))}
    </VStack>
  )
}

function VeBetterTab() {
  return (
    <VStack gap={5} align="stretch">
      <Section title="What Is Auto-Voting?">
        <Text textStyle="sm" color="text.subtle">
          {
            "Every week, VeBetterDAO runs a voting round where you vote for your favorite sustainable apps. The more votes an app gets, the more B3TR rewards it earns \u2014 and you earn rewards too just for voting."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {"The problem? You have to remember to vote every single week. Miss a week, miss your rewards."}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "Auto-voting fixes this. You pick your favorite apps once, flip a switch, and your votes get cast automatically every week. Your rewards get claimed automatically too. You never have to think about it again."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="Who Actually Casts My Vote?">
        <Text textStyle="sm" color="text.subtle">
          {
            "Relayers. They\u2019re services (run by apps, community members, or anyone trusted) that watch the blockchain, see you\u2019ve opted in, and submit your vote + claim your rewards for you."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "Think of them like a helpful neighbor who drops your ballot in the mailbox every week because you asked them to."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="Do I Pay For This?">
        <Text textStyle="sm" color="text.subtle">
          {
            "Sort of \u2014 but you never reach into your pocket. A small fee (10% of your weekly rewards, max 100 B3TR) is automatically taken from your earnings to pay the relayers. If you earn 500 B3TR, 50 goes to the relayer pool. You keep 450."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {"No gas costs. No transactions to sign. No tokens to send anywhere."}
        </Text>
      </Section>

      <Separator />

      <Section title="Is My Money Safe?">
        <Text textStyle="sm" color="text.subtle">
          {
            "Your tokens never leave your wallet. This is the key difference from older solutions like veDelegate, where you actually hand over your voting power. Here, relayers can only do two things: cast your vote with YOUR preferences, and send YOUR rewards to YOUR wallet. That\u2019s it."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="What Do I Need To Get Started?">
        <BulletList
          items={[
            "Hold at least 1 VOT3 token",
            "Have completed 3 sustainable actions on any app",
            "Not be flagged as a bot",
            "Pick at least one app to vote for",
          ]}
        />
        <Text textStyle="sm" color="text.subtle">
          {"Go to the allocations page, choose your apps, toggle auto-voting on. It kicks in next week."}
        </Text>
      </Section>

      <Separator />

      <Section title="What If I Change My Mind?">
        <Text textStyle="sm" color="text.subtle">
          {
            "Turn it off anytime. You can also change your app preferences whenever you want \u2014 the new choices apply from the next round."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "While auto-voting is active, you can\u2019t vote manually. If the relayer hasn\u2019t claimed your rewards after 5 days, you can step in and claim them yourself."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="What If Something Goes Wrong?">
        <Text textStyle="sm" color="text.subtle">
          {"Auto-voting turns itself off if:"}
        </Text>
        <BulletList
          items={[
            "Your VOT3 balance drops below 1",
            "All your chosen apps become ineligible",
            "You stop doing sustainable actions",
            "You get flagged as a bot",
          ]}
        />
        <Text textStyle="sm" color="text.subtle">
          {"You\u2019ll just go back to voting manually until you fix whatever triggered it."}
        </Text>
      </Section>
    </VStack>
  )
}

function RelayersTab() {
  return (
    <VStack gap={5} align="stretch">
      <Section title="What Is a Relayer?">
        <Text textStyle="sm" color="text.subtle">
          {
            'You\u2019re basically volunteering to press the "vote" and "claim" buttons for other people who turned on auto-voting. In return, you get a cut of their rewards.'
          }
        </Text>
      </Section>

      <Separator />

      <Section title="Relayer Rewards">
        <Text textStyle="sm" color="text.subtle">
          {
            "Every user you serve pays 10% of their weekly rewards (max 100 B3TR per user) into a shared pool. At the end of the week, that pool gets split among all relayers based on how much work each one did."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "Everyone has to be served. If even one user gets missed \u2014 no vote cast, no rewards claimed \u2014 nobody gets paid. The whole pool stays locked until every single user is taken care of. This keeps relayers honest and motivated to finish the job."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "Safety net: if registered relayers don\u2019t finish within 5 days, anyone can step in and complete the remaining work."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="Weights">
        <Text textStyle="sm" color="text.subtle">
          {"Weights determine how the reward pool is distributed among relayers:"}
        </Text>
        <BulletList
          items={[
            "Voting for someone = 3 points (higher because voting is more gas-intensive)",
            "Claiming their rewards = 1 point",
            "One full user per round = 4 weighted points (1 vote + 1 claim)",
          ]}
        />
        <Text textStyle="sm" color="text.subtle">
          {"More points = bigger share of the pool."}
        </Text>
        <Text textStyle="sm" color="text.subtle" fontStyle="italic">
          {
            "Example: If the pool has 4 B3TR and a relayer completes 2 votes + 1 claim (2\u00D73 + 1\u00D71 = 7 points) out of 8 total points, they earn 3.5 B3TR."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="Who Can Be a Relayer?">
        <Text textStyle="sm" color="text.subtle">
          {
            "The system is designed for anyone: apps, community members, developers. If the community trusts you, you can run a relayer."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="FAQ">
        <Text textStyle="sm" color="text.subtle" fontWeight="semibold">
          {"Who claims the relayer payout?"}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {"Each relayer claims their own share after the round is fully complete."}
        </Text>

        <Text textStyle="sm" color="text.subtle" fontWeight="semibold" mt={2}>
          {"Does it matter who you serve?"}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "For users \u2014 no, they get the same result regardless. For relayers \u2014 yes, you only earn credit for work you personally do. And it\u2019s first-come-first-served: if another relayer handles a user before you, you get nothing for that user (and waste gas trying)."
          }
        </Text>
      </Section>

      <Separator />

      <Section title="Why Would an App Want to Be a Relayer?">
        <Text textStyle="sm" color="text.subtle">
          {
            "If you\u2019re an app on VeBetterDAO, this is a no-brainer. Instead of paying veDelegate to get votes directed your way, you become a relayer yourself. Your users set you as a preference, you execute their votes (which go to your app), and you earn relayer fees on top."
          }
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {
            "You go from paying for votes to getting paid to handle them. Important: don\u2019t be shady about it. Add your app to the user\u2019s preference list \u2014 don\u2019t replace their other choices."
          }
        </Text>
      </Section>
    </VStack>
  )
}

function DevsTab() {
  return (
    <VStack gap={5} align="stretch">
      <Section title="Getting Started">
        <Text textStyle="sm" color="text.subtle">
          {"To integrate as a relayer:"}
        </Text>
        <BulletList
          items={[
            "Get registered (currently admin-only via POOL_ADMIN_ROLE)",
            "Read getTotalAutoVotingUsersAtRoundStart() to know how many users to serve",
            "Call castVoteOnBehalfOf() during early access window",
            "Call reward claims after round ends",
            "Claim your relayer rewards from RelayerRewardsPool.claimRewards()",
          ]}
        />
      </Section>

      <Separator />

      <Section title="User Eligibility (at snapshot time)">
        <BulletList
          items={[
            "Min 1 VOT3",
            "3+ sustainable actions",
            "Not bot-flagged by app owners",
            "At least 1 eligible app selected",
          ]}
        />
      </Section>

      <Separator />

      <Section title="Timing & Rules">
        <BulletList
          items={[
            "Enable during round N \u2192 kicks in from round N+1",
            "Active auto-voting blocks manual voting/claiming during the round",
            "If relayer hasn\u2019t processed after 5 days post-round, users can manually claim",
            "Auto-disable triggers: all apps ineligible, VOT3 < 1, action threshold drop, bot detection",
          ]}
        />
      </Section>

      <Separator />

      <Section title="Resources">
        <VStack align="start" gap={2}>
          <Link
            href="https://docs.vebetterdao.org/vebetter/automation"
            target="_blank"
            textStyle="sm"
            colorPalette="blue">
            {"Docs: Auto-Voting Documentation"}
          </Link>
          <Link
            href="https://governance.vebetterdao.org/proposals/93450486232994296830196736391400835825360450263361422145364815974754963306849"
            target="_blank"
            textStyle="sm"
            colorPalette="blue">
            {"Governance proposal (full spec)"}
          </Link>
          <Link
            href="https://vechain.discourse.group/t/vebetterdao-proposal-auto-voting-for-x-allocation-with-gasless-voting-and-relayer-rewards/559"
            target="_blank"
            textStyle="sm"
            colorPalette="blue">
            {"Discourse proposal (design rationale)"}
          </Link>
          <Link
            href="https://github.com/vechain/vebetterdao-contracts"
            target="_blank"
            textStyle="sm"
            colorPalette="blue">
            {"GitHub: Contract source code"}
          </Link>
        </VStack>
      </Section>

      <Separator />

      <Section title="NPM Package">
        <Text textStyle="sm" color="text.subtle">
          {"Install @vechain/vebetterdao-contracts via npm/yarn for ABIs and typechain types."}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {"Key imports used in this dashboard:"}
        </Text>
        <BulletList
          items={[
            "@vechain/vebetterdao-contracts/factories/RelayerRewardsPool__factory",
            "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory",
          ]}
        />
      </Section>

      <Separator />

      <Section title="Inspect On-Chain">
        <Text textStyle="sm" color="text.subtle">
          {"Use VeChain Explorer (inspect.vechain.org) to inspect contracts on mainnet."}
        </Text>
      </Section>
    </VStack>
  )
}

export function InfoContent() {
  return (
    <VStack gap={6} align="stretch" maxW="breakpoint-md">
      <Heading size="xl" fontWeight="bold">
        {"Auto-Voting & Relayers"}
      </Heading>

      <Tabs.Root defaultValue="vebetter" fitted>
        <Tabs.List>
          <Tabs.Trigger value="vebetter">
            <HStack gap={1.5}>
              <Icon boxSize={4}>
                <B3trIcon />
              </Icon>
              {"VeBetter"}
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="relayers">
            <HStack gap={1.5}>
              <Icon boxSize={4}>
                <LuRadar />
              </Icon>
              {"Relayers"}
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="devs">
            <HStack gap={1.5}>
              <Icon boxSize={4}>
                <LuCode />
              </Icon>
              {"Devs"}
            </HStack>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="vebetter" pt={6}>
          <VeBetterTab />
        </Tabs.Content>
        <Tabs.Content value="relayers" pt={6}>
          <RelayersTab />
        </Tabs.Content>
        <Tabs.Content value="devs" pt={6}>
          <DevsTab />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}

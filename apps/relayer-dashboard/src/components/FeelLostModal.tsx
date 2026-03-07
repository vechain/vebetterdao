"use client"

import { Heading, Separator, Text, VStack } from "@chakra-ui/react"

import { BaseModal } from "./BaseModal"

interface FeelLostModalProps {
  isOpen: boolean
  onClose: () => void
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

export function FeelLostModal({ isOpen, onClose }: FeelLostModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton isCloseable>
      <VStack gap={5} align="stretch">
        <Heading size="lg" fontWeight="bold">
          {"What is Auto-Voting?"}
        </Heading>

        <Text textStyle="sm" color="text.subtle">
          {
            "Every week, VeBetterDAO runs a voting round where you vote for your favorite sustainable apps. The more votes an app gets, the more B3TR rewards it earns — and you earn rewards too just for voting."
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

        <Separator />

        <Section title="Who Actually Casts My Vote?">
          <Text textStyle="sm" color="text.subtle">
            {
              "Relayers. They're services (run by apps, community members, or anyone trusted) that watch the blockchain, see you've opted in, and submit your vote + claim your rewards for you."
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
              "Sort of — but you never reach into your pocket. A small fee (10% of your weekly rewards, max 100 B3TR) is automatically taken from your earnings to pay the relayers. If you earn 500 B3TR, 50 goes to the relayer pool. You keep 450."
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
              "Your tokens never leave your wallet. This is the key difference from older solutions like veDelegate, where you actually hand over your voting power. Here, relayers can only do two things: cast your vote with YOUR preferences, and send YOUR rewards to YOUR wallet. That's it."
            }
          </Text>
        </Section>

        <Separator />

        <Section title="What Do I Need To Get Started?">
          <VStack align="start" gap={1} pl={4}>
            <Text textStyle="sm" color="text.subtle">
              {"• Hold at least 1 VOT3 token"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"• Have completed 3 sustainable actions on any app"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"• Not be flagged as a bot"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"• Pick at least one app to vote for"}
            </Text>
          </VStack>
          <Text textStyle="sm" color="text.subtle">
            {"Go to the allocations page, choose your apps, toggle auto-voting on. It kicks in next week."}
          </Text>
        </Section>

        <Separator />

        <Section title="What If I Change My Mind?">
          <Text textStyle="sm" color="text.subtle">
            {
              "Turn it off anytime. You can also change your app preferences whenever you want — the new choices apply from the next round."
            }
          </Text>
          <Text textStyle="sm" color="text.subtle">
            {
              "While auto-voting is active, you can't vote manually. If the relayer hasn't claimed your rewards after 5 days, you can step in and claim them yourself."
            }
          </Text>
        </Section>

        <Separator />

        <Section title="What If Something Goes Wrong?">
          <Text textStyle="sm" color="text.subtle">
            {"Auto-voting turns itself off if:"}
          </Text>
          <VStack align="start" gap={1} pl={4}>
            <Text textStyle="sm" color="text.subtle">
              {"• Your VOT3 balance drops below 1"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"• All your chosen apps become ineligible"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"• You stop doing sustainable actions"}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {"• You get flagged as a bot"}
            </Text>
          </VStack>
          <Text textStyle="sm" color="text.subtle">
            {"You'll just go back to voting manually until you fix whatever triggered it."}
          </Text>
        </Section>
      </VStack>
    </BaseModal>
  )
}

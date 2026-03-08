"use client"

import { Box, Button, Card, Code, Heading, HStack, Icon, Input, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { Address, HDKey, Transaction } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { useState, useRef, useCallback, useEffect } from "react"
import { LuClipboard, LuContainer, LuGlobe, LuPackage, LuPlay, LuSquare } from "react-icons/lu"

import { RelayerTerminal } from "@/components/RelayerTerminal"
import { getNetworkConfig } from "@/relayer/config"
import { fetchSummary } from "@/relayer/contracts"
import { runCastVoteCycle, runClaimRewardCycle } from "@/relayer/relayer"
import type { SendTransaction } from "@/relayer/types"

import { renderSummaryText, renderCycleResultText, ts } from "./format"

function deriveWallet(mnemonic: string): { walletAddress: string; privateKey: string } | null {
  try {
    const words = mnemonic.trim().split(/\s+/)
    if (words.length < 12) return null
    const child = HDKey.fromMnemonic(words).deriveChild(0)
    const raw = child.privateKey
    if (!raw) return null
    return {
      walletAddress: Address.ofPublicKey(child.publicKey as Uint8Array).toString(),
      privateKey: Buffer.from(raw).toString("hex"),
    }
  } catch {
    return null
  }
}

function createSender(thor: ThorClient, privateKey: string): SendTransaction {
  return async (clauses, gas) => {
    const body = await thor.transactions.buildTransactionBody(clauses, gas)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signed = Transaction.of(body).sign(Buffer.from(privateKey, "hex")) as any
    const sent = await thor.transactions.sendTransaction(signed)
    return sent.id
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button onClick={handleCopy} variant="ghost" size="xs" rounded="full" opacity={0.7} _hover={{ opacity: 1 }}>
      <LuClipboard />
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

function OptionBanner({
  IconComponent,
  title,
  description,
  command,
  active,
  onClick,
}: {
  IconComponent: typeof LuGlobe
  title: string
  description: string
  command?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Card.Root
      cursor={onClick ? "pointer" : undefined}
      onClick={onClick}
      borderWidth="2px"
      borderColor={active ? "actions.primary.default" : "border.secondary"}
      _hover={onClick ? { borderColor: "actions.primary.default", transform: "translateY(-2px)" } : undefined}
      transition="all 0.2s">
      <Card.Body gap={3}>
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="bg.tertiary">
            <Icon boxSize={5} color="text.default">
              <IconComponent />
            </Icon>
          </Box>
          <VStack align="start" gap={0}>
            <Text fontWeight="bold" textStyle="md">
              {title}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {description}
            </Text>
          </VStack>
        </HStack>
        {command && (
          <HStack
            bg="bg.tertiary"
            borderRadius="md"
            px={3}
            py={2}
            justify="space-between"
            onClick={e => e.stopPropagation()}>
            <Code bg="transparent" textStyle="xs" fontFamily="mono" wordBreak="break-all">
              {command}
            </Code>
            <CopyButton text={command} />
          </HStack>
        )}
      </Card.Body>
    </Card.Root>
  )
}

export function RunRelayer() {
  const [mnemonic, setMnemonic] = useState("")
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const abortRef = useRef(false)
  const writelnRef = useRef<((msg: string) => void) | null>(null)
  const clearRef = useRef<(() => void) | null>(null)

  // Clear mnemonic when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      setMnemonic("")
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      setMnemonic("")
    }
  }, [])

  const log = useCallback((msg: string) => {
    writelnRef.current?.(`${ts()} ${msg}`)
  }, [])

  const handleTerminalReady = useCallback((writeln: (msg: string) => void, clear: () => void) => {
    writelnRef.current = writeln
    clearRef.current = clear
  }, [])

  const handleStart = useCallback(async () => {
    const wallet = deriveWallet(mnemonic)
    if (!wallet) {
      log("\x1b[31mInvalid mnemonic. Enter a valid 12/24 word BIP39 phrase.\x1b[0m")
      return
    }

    abortRef.current = false
    setRunning(true)
    setStarted(true)

    const config = getNetworkConfig()
    const thor = ThorClient.at(config.nodeUrl, { isPollingEnabled: false })
    const sendTx = createSender(thor, wallet.privateKey)

    log(`\x1b[36mVeBetterDAO Relayer Node\x1b[0m`)
    log(`Network: \x1b[1m${config.name}\x1b[0m`)
    log(`Address: \x1b[33m${wallet.walletAddress}\x1b[0m`)
    log("")

    while (!abortRef.current) {
      try {
        log("Fetching on-chain state...")
        const summary = await fetchSummary(thor, config, wallet.walletAddress)

        clearRef.current?.()
        const summaryLines = renderSummaryText(summary)
        summaryLines.forEach(line => writelnRef.current?.(line))
        writelnRef.current?.("")

        if (abortRef.current) break

        // Cast votes
        if (summary.isRoundActive) {
          log("Starting cast-vote cycle...")
          const voteResult = await runCastVoteCycle(thor, config, wallet.walletAddress, sendTx, 50, false, log)
          if (abortRef.current) break
          renderCycleResultText(voteResult).forEach(log)
        } else {
          log("\x1b[90mRound not active, skipping cast-vote\x1b[0m")
        }

        if (abortRef.current) break

        // Claim rewards
        log("Starting claim cycle...")
        const claimResult = await runClaimRewardCycle(thor, config, wallet.walletAddress, sendTx, 50, false, log)
        if (abortRef.current) break
        renderCycleResultText(claimResult).forEach(log)

        // Re-fetch summary
        log("Refreshing state...")
        const updated = await fetchSummary(thor, config, wallet.walletAddress)
        clearRef.current?.()
        renderSummaryText(updated).forEach(line => writelnRef.current?.(line))
        writelnRef.current?.("")

        if (abortRef.current) break

        log(`Next cycle in 5m...`)
        // Sleep 5 min, checking abort every second
        for (let i = 0; i < 300 && !abortRef.current; i++) {
          await new Promise(r => setTimeout(r, 1000))
        }
      } catch (err) {
        log(`\x1b[31mCycle error: ${err instanceof Error ? err.message : String(err)}\x1b[0m`)
        if (abortRef.current) break
        // Wait 30s before retry
        for (let i = 0; i < 30 && !abortRef.current; i++) {
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }

    log("\x1b[33mStopped.\x1b[0m")
    setRunning(false)
  }, [mnemonic, log])

  const handleStop = useCallback(() => {
    abortRef.current = true
    log("\x1b[33mStopping after current operation...\x1b[0m")
  }, [log])

  return (
    <VStack gap={6} align="stretch" w="full">
      <VStack align="start" gap={1}>
        <Heading size="lg">{"Run Relayer"}</Heading>
        <Text textStyle="sm" color="text.subtle">
          {"Choose how to run your relayer node. All options use the same core logic."}
        </Text>
      </VStack>

      {!started && (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <OptionBanner
              IconComponent={LuGlobe}
              title="Run in Browser"
              description="Paste your mnemonic and run directly here. No install needed."
              active
            />
            <OptionBanner
              IconComponent={LuContainer}
              title="Run with Docker"
              description="Run on a server or locally. Persistent, headless, auto-restarts."
              command='docker run -it --env MNEMONIC="..." ghcr.io/vechain/vebetterdao-relayer-node'
            />
            <OptionBanner
              IconComponent={LuPackage}
              title="Run with npm"
              description="One command, no clone needed. Requires Node.js 20+."
              command='MNEMONIC="..." npx @vebetterdao/relayer-node'
            />
          </SimpleGrid>

          <Card.Root>
            <Card.Body gap={4}>
              <Text textStyle="sm" color="text.subtle">
                {
                  "Enter your mnemonic to start the relayer in your browser. It stays in memory only and is cleared when you leave this page."
                }
              </Text>
              <Input
                type="password"
                placeholder="Enter your 12 or 24 word mnemonic..."
                value={mnemonic}
                onChange={e => setMnemonic(e.target.value)}
                fontFamily="mono"
                size="lg"
              />
              <HStack>
                <Button
                  onClick={handleStart}
                  disabled={mnemonic.trim().split(/\s+/).length < 12}
                  variant="solid"
                  rounded="full">
                  <LuPlay />
                  {"Start Relayer"}
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        </>
      )}

      {started && (
        <Box>
          <HStack mb={3} justify="end">
            {running ? (
              <Button onClick={handleStop} colorPalette="red" variant="outline" rounded="full" size="sm">
                <LuSquare />
                {"Stop"}
              </Button>
            ) : (
              <Button onClick={handleStart} variant="solid" rounded="full" size="sm">
                <LuPlay />
                {"Restart"}
              </Button>
            )}
          </HStack>
          <RelayerTerminal onReady={handleTerminalReady} />
        </Box>
      )}
    </VStack>
  )
}

"use client"

import {
  Badge,
  Box,
  Button,
  Card,
  Clipboard,
  Code,
  Heading,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Address, HDKey } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { getNetworkConfig } from "@vechain/vebetterdao-relayer-node/dist/config"
import { fetchSummary } from "@vechain/vebetterdao-relayer-node/dist/contracts"
import { runCastVoteCycle, runClaimRewardCycle } from "@vechain/vebetterdao-relayer-node/dist/relayer"
import { useState, useRef, useCallback, useEffect } from "react"
import { FaAndroid, FaApple } from "react-icons/fa"
import {
  LuContainer,
  LuGlobe,
  LuMaximize2,
  LuMinimize2,
  LuPackage,
  LuPlay,
  LuSmartphone,
  LuSquare,
  LuCircleX,
} from "react-icons/lu"

import { RelayerTerminal } from "@/components/RelayerTerminal"

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

function CopyButton({ text }: { text: string }) {
  return (
    <Clipboard.Root value={text}>
      <Clipboard.Trigger asChild>
        <IconButton variant="ghost" size="xs" rounded="full" opacity={0.7} _hover={{ opacity: 1 }}>
          <Clipboard.Indicator />
        </IconButton>
      </Clipboard.Trigger>
    </Clipboard.Root>
  )
}

export function RunRelayer() {
  const [mnemonic, setMnemonic] = useState("")
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const abortRef = useRef(false)
  const writelnRef = useRef<((msg: string) => void) | null>(null)
  const clearRef = useRef<(() => void) | null>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [stopRequested, setStopRequested] = useState(false)
  const forceExitResolveRef = useRef<(() => void) | null>(null)
  const suppressLogRef = useRef(false)

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

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const log = useCallback((msg: string) => {
    if (suppressLogRef.current) return
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
    suppressLogRef.current = false
    setStopRequested(false)
    setRunning(true)
    setStarted(true)
    setWalletAddress(wallet.walletAddress)

    const forceExitPromise = new Promise<"force">(r => {
      forceExitResolveRef.current = () => r("force")
    })
    const raceForceExit = <T,>(p: Promise<T>): Promise<T | null> => Promise.race([p, forceExitPromise.then(() => null)])

    const network = process.env.NEXT_PUBLIC_APP_ENV || "mainnet"
    const config = getNetworkConfig(network)
    const thor = ThorClient.at(config.nodeUrl, { isPollingEnabled: false })

    log(`\x1b[36mVeBetterDAO Relayer Node\x1b[0m`)
    log(`Network: \x1b[1m${config.name}\x1b[0m`)
    log(`Address: \x1b[33m${wallet.walletAddress}\x1b[0m`)
    log("")

    while (!abortRef.current) {
      try {
        log("Fetching on-chain state...")
        const summary = await raceForceExit(fetchSummary(thor, config, wallet.walletAddress))
        if (summary === null) break

        clearRef.current?.()
        const summaryLines = renderSummaryText(summary)
        summaryLines.forEach(line => writelnRef.current?.(line))
        writelnRef.current?.("")

        if (abortRef.current) break

        // Cast votes
        if (summary.isRoundActive) {
          log("Starting cast-vote cycle...")
          const voteResult = await raceForceExit(
            runCastVoteCycle(thor, config, wallet.walletAddress, wallet.privateKey, 50, false, log),
          )
          if (voteResult === null) break
          if (abortRef.current) break
          renderCycleResultText(voteResult).forEach(log)
        } else {
          log("\x1b[90mRound not active, skipping cast-vote\x1b[0m")
        }

        if (abortRef.current) break

        // Claim rewards
        log("Starting claim cycle...")
        const claimResult = await raceForceExit(
          runClaimRewardCycle(thor, config, wallet.walletAddress, wallet.privateKey, 50, false, log),
        )
        if (claimResult === null) break
        if (abortRef.current) break
        renderCycleResultText(claimResult).forEach(log)

        // Re-fetch summary
        log("Refreshing state...")
        const updated = await raceForceExit(fetchSummary(thor, config, wallet.walletAddress))
        if (updated === null) break
        clearRef.current?.()
        renderSummaryText(updated).forEach(line => writelnRef.current?.(line))
        writelnRef.current?.("")

        if (abortRef.current) break

        log(`Next cycle in 5m...`)
        // Sleep 5 min, checking abort every second (force exit breaks immediately)
        for (let i = 0; i < 300 && !abortRef.current; i++) {
          const r = await Promise.race([
            new Promise<"tick">(r => setTimeout(() => r("tick"), 1000)),
            forceExitPromise.then(() => "force" as const),
          ])
          if (r === "force") break
        }
      } catch (err) {
        log(`\x1b[31mCycle error: ${err instanceof Error ? err.message : String(err)}\x1b[0m`)
        if (abortRef.current) break
        // Wait 30s before retry (force exit breaks immediately)
        for (let i = 0; i < 30 && !abortRef.current; i++) {
          const r = await Promise.race([
            new Promise<"tick">(r => setTimeout(() => r("tick"), 1000)),
            forceExitPromise.then(() => "force" as const),
          ])
          if (r === "force") break
        }
      }
    }

    if (suppressLogRef.current) {
      writelnRef.current?.(`${ts()} \x1b[33mStopped.\x1b[0m`)
    } else {
      log("\x1b[33mStopped.\x1b[0m")
    }
    setRunning(false)
    setStopRequested(false)
  }, [mnemonic, log])

  const handleStop = useCallback(() => {
    setStopRequested(true)
    abortRef.current = true
    log("\x1b[33mStopping after current operation...\x1b[0m")
  }, [log])

  const handleForceExit = useCallback(() => {
    abortRef.current = true
    suppressLogRef.current = true
    forceExitResolveRef.current?.()
    forceExitResolveRef.current = null
    writelnRef.current?.(`${ts()} \x1b[33mForce exiting...\x1b[0m`)
  }, [])

  return (
    <VStack gap={6} align="stretch" w="full">
      <VStack align="start" gap={1}>
        <Heading size="lg">{started ? "Relayer output" : "Run Relayer"}</Heading>
        <Text textStyle="sm" color="text.subtle">
          {started
            ? "Live log from your relayer running in this browser. Stop or force exit above; close the tab to end the session."
            : "Choose how to run your relayer node. All options use the same core logic."}
        </Text>
      </VStack>

      {!started && (
        <>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {/* Run in Browser */}
            <Card.Root borderWidth="2px" borderColor="actions.primary.default">
              <Card.Body gap={8}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="bg.tertiary">
                    <LuGlobe size={20} />
                  </Box>
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold" textStyle="md">
                      {"Run in Browser"}
                    </Text>
                    <Text textStyle="sm" color="text.subtle">
                      {"Paste your mnemonic and run directly here. No install needed."}
                    </Text>
                  </VStack>
                </HStack>

                <VStack align="start" gap={5}>
                  <Input
                    type="password"
                    placeholder="Enter your mnemonic..."
                    value={mnemonic}
                    onChange={e => setMnemonic(e.target.value)}
                    fontFamily="mono"
                    size="lg"
                  />
                  <Text textStyle="xs" color="text.subtle">
                    {"Stays in memory only — cleared when you leave."}
                  </Text>
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
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Docker + npm */}
            <Card.Root borderWidth="2px" borderColor="border.secondary">
              <Card.Body gap={8}>
                <VStack gap={4}>
                  <HStack gap={3} w="full" justify={"start"}>
                    <Box p={2} borderRadius="lg" bg="bg.tertiary">
                      <LuContainer size={20} />
                    </Box>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" textStyle="md">
                        {"Run with Docker"}
                      </Text>
                      <Text textStyle="sm" color="text.subtle">
                        {"Persistent, headless, auto-restarts."}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack bg="bg.tertiary" borderRadius="md" px={3} py={2} justify="space-between">
                    <Code bg="transparent" textStyle="xs" fontFamily="mono" wordBreak="break-all">
                      {'docker run -it --env MNEMONIC="..." ghcr.io/vechain/vebetterdao-relayer-node'}
                    </Code>
                    <CopyButton text='docker run -it --env MNEMONIC="..." ghcr.io/vechain/vebetterdao-relayer-node' />
                  </HStack>
                </VStack>

                <VStack gap={4}>
                  <HStack gap={3} w="full" justify={"start"}>
                    <Box p={2} borderRadius="lg" bg="bg.tertiary">
                      <LuPackage size={20} />
                    </Box>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" textStyle="md">
                        {"Run with npm"}
                      </Text>
                      <Text textStyle="sm" color="text.subtle">
                        {"One command, requires Node.js 20+."}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack bg="bg.tertiary" borderRadius="md" px={3} py={2} justify="space-between" w="full">
                    <Code bg="transparent" textStyle="xs" fontFamily="mono" wordBreak="break-all">
                      {'MNEMONIC="..." npx @vechain/vebetterdao-relayer-node'}
                    </Code>
                    <CopyButton text='MNEMONIC="..." npx @vechain/vebetterdao-relayer-node' />
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Run on Phone — coming soon */}
          <Card.Root borderWidth="2px" borderColor="border.secondary" opacity={0.6}>
            <Card.Body gap={3}>
              <HStack gap={3} justify="space-between">
                <HStack>
                  <Box p={2} borderRadius="lg" bg="bg.tertiary">
                    <LuSmartphone size={20} />
                  </Box>
                  <VStack align="start" gap={0}>
                    <HStack gap={2}>
                      <Text fontWeight="bold" textStyle="md">
                        {"Run on Phone"}
                      </Text>
                      <Badge variant="subtle" size="sm">
                        {"Coming soon"}
                      </Badge>
                    </HStack>
                    <Text textStyle="sm" color="text.subtle">
                      {"Run your relayer from your mobile device."}
                    </Text>
                  </VStack>
                </HStack>
                <HStack gap={4} justify="center" py={4}>
                  <FaAndroid size={32} />
                  <FaApple size={32} />
                </HStack>
              </HStack>
            </Card.Body>
          </Card.Root>
        </>
      )}

      {started && (
        <Box>
          <HStack mb={3} gap={2} align="center" py={1} flexWrap="wrap" justify="space-between">
            <HStack gap={2} minW={0}>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                flexShrink={0}
                bg={running && !stopRequested ? "green.400" : stopRequested ? "orange.400" : "red.400"}
              />
              <Text textStyle="sm" fontFamily="mono" color="text.subtle" truncate>
                {running && !stopRequested ? "Running" : stopRequested ? "Stopping" : "Stopped"}
                {walletAddress && ` · ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </Text>
              {walletAddress && <CopyButton text={walletAddress} />}
            </HStack>

            <HStack gap={2} flexShrink={0} css={{ touchAction: "manipulation" }}>
              {running ? (
                stopRequested ? (
                  <Button
                    onClick={handleForceExit}
                    colorPalette="red"
                    variant="outline"
                    rounded="full"
                    size="sm"
                    minH="44px"
                    minW="44px"
                    css={{ touchAction: "manipulation" }}>
                    <LuCircleX />
                    {"Force exit"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStop}
                    colorPalette="red"
                    variant="outline"
                    rounded="full"
                    size="sm"
                    minH="44px"
                    minW="44px"
                    css={{ touchAction: "manipulation" }}>
                    <LuSquare />
                    {"Stop"}
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleStart}
                  variant="solid"
                  rounded="full"
                  size="sm"
                  minH="44px"
                  css={{ touchAction: "manipulation" }}>
                  <LuPlay />
                  {"Restart"}
                </Button>
              )}
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                rounded="full"
                size="sm"
                minH="44px"
                minW="44px"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                css={{ touchAction: "manipulation" }}>
                {isFullscreen ? <LuMinimize2 /> : <LuMaximize2 />}
                {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </Button>
            </HStack>
          </HStack>

          <Box
            ref={fullscreenRef}
            position={isFullscreen ? "fixed" : "relative"}
            inset={isFullscreen ? 0 : undefined}
            zIndex={isFullscreen ? 9999 : 1}
            bg="#1a1a2e"
            borderRadius={isFullscreen ? 0 : "12px"}
            display={isFullscreen ? "flex" : undefined}
            flexDirection={isFullscreen ? "column" : undefined}>
            {isFullscreen && (
              <Button
                position="absolute"
                top={2}
                right={2}
                zIndex={10}
                size="sm"
                variant="outline"
                rounded="full"
                onClick={toggleFullscreen}
                bg="bg.panel"
                _hover={{ bg: "bg.tertiary" }}>
                <LuMinimize2 />
                {"Exit fullscreen"}
              </Button>
            )}
            <RelayerTerminal onReady={handleTerminalReady} fullscreen={isFullscreen} />
          </Box>
        </Box>
      )}
    </VStack>
  )
}

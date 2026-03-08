"use client"

import { Box } from "@chakra-ui/react"
import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import { useEffect, useRef, useCallback } from "react"
import "@xterm/xterm/css/xterm.css"

interface RelayerTerminalProps {
  onReady: (writeln: (msg: string) => void, clear: () => void) => void
  fullscreen?: boolean
}

export function RelayerTerminal({ onReady, fullscreen }: RelayerTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  const initTerminal = useCallback(() => {
    if (!containerRef.current || terminalRef.current) return

    const term = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      fontSize: 13,
      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
      lineHeight: 1.4,
      scrollback: 1000,
      theme: {
        background: "#1a1a2e",
        foreground: "#e4e4e4",
        cursor: "#e4e4e4",
        black: "#1a1a2e",
        red: "#ff6b6b",
        green: "#51cf66",
        yellow: "#fcc419",
        blue: "#339af0",
        magenta: "#cc5de8",
        cyan: "#22b8cf",
        white: "#e4e4e4",
        brightBlack: "#6c6c6c",
        brightRed: "#ff8787",
        brightGreen: "#69db7c",
        brightYellow: "#ffd43b",
        brightBlue: "#5c7cfa",
        brightMagenta: "#da77f2",
        brightCyan: "#3bc9db",
        brightWhite: "#ffffff",
      },
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = term
    fitAddonRef.current = fitAddon

    const writeln = (msg: string) => {
      term.writeln(msg)
    }
    const clear = () => {
      term.clear()
    }

    onReady(writeln, clear)
  }, [onReady])

  useEffect(() => {
    initTerminal()

    const handleResize = () => {
      fitAddonRef.current?.fit()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      terminalRef.current?.dispose()
      terminalRef.current = null
    }
  }, [initTerminal])

  useEffect(() => {
    if (fullscreen) fitAddonRef.current?.fit()
  }, [fullscreen])

  return (
    <Box
      ref={containerRef}
      w="full"
      h={fullscreen ? "100%" : { base: "400px", md: "500px" }}
      minH={fullscreen ? "100%" : { base: "400px", md: "500px" }}
      flex={fullscreen ? 1 : undefined}
      borderRadius="12px"
      overflow="hidden"
      border="1px solid"
      borderColor="border.secondary"
      bg="#1a1a2e"
      p={2}
      css={{
        // Allow touch scrolling of terminal viewport on mobile (xterm's scrollable area)
        "& .xterm-viewport": {
          overflow: "auto !important",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        },
      }}
    />
  )
}

"use client"

import { Button, Icon } from "@chakra-ui/react"
import Script from "next/script"
import { useCallback } from "react"

import { useColorMode } from "@/components/ui/color-mode"

declare global {
  interface Window {
    Kapa?: { open: () => void }
  }
}

function RobotIcon() {
  return (
    <Icon asChild boxSize="18px">
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path
          d="M6.08679 7.99999C6.43895 8.00001 6.72446 8.29848 6.72446 8.66666V10C6.72437 10.3681 6.4389 10.6666 6.08679 10.6667C5.73477 10.6665 5.44921 10.368 5.44912 10V8.66666C5.44913 8.29854 5.73472 8.00011 6.08679 7.99999Z"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        <path
          d="M9.91278 7.99999C10.2649 8.00001 10.5504 8.29848 10.5504 8.66666V10C10.5504 10.3681 10.2649 10.6666 9.91278 10.6667C9.56076 10.6665 9.2752 10.368 9.27512 10V8.66666C9.27512 8.29854 9.56072 8.00011 9.91278 7.99999Z"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.46193 0.861922C9.71095 0.6016 10.1146 0.601617 10.3636 0.861922C10.6127 1.12227 10.6126 1.54428 10.3636 1.80464L8.63745 3.60933V4.66663H11.8258C12.8823 4.66665 13.7388 5.56208 13.7388 6.66664V7.49087L14.2052 6.90623C14.4306 6.62345 14.8333 6.5853 15.1038 6.82094C15.3743 7.05667 15.4108 7.47757 15.1854 7.7604L13.7388 9.57486V12C13.7387 13.1045 12.8822 14 11.8258 14H4.17379C3.11743 13.9999 2.26088 13.1044 2.2608 12V9.57486L0.81422 7.7604C0.588866 7.47764 0.625506 7.05669 0.895796 6.82094C1.16632 6.58526 1.56891 6.62346 1.79438 6.90623L2.2608 7.49087V6.66664C2.2608 5.56215 3.11738 4.66676 4.17379 4.66663H7.36212V3.81311L5.88503 3.29879C5.55122 3.18224 5.37094 2.8048 5.48213 2.45568C5.59355 2.10656 5.95456 1.91816 6.28855 2.03446L7.82729 2.57027L9.46193 0.861922ZM4.17379 5.99997C3.82173 6.0001 3.53613 6.29853 3.53613 6.66664V12C3.53621 12.368 3.82178 12.6666 4.17379 12.6667H11.8258C12.1779 12.6667 12.4634 12.3681 12.4634 12V6.66664C12.4634 6.29847 12.1779 5.99999 11.8258 5.99997H4.17379Z"
        />
      </svg>
    </Icon>
  )
}

export function KapaWidgetProvider() {
  const { colorMode } = useColorMode()
  const isDarkMode = colorMode === "dark"

  const handleOpen = useCallback(() => {
    window.Kapa?.open()
  }, [])

  return (
    <>
      <Script
        src="https://widget.kapa.ai/kapa-widget.bundle.js"
        data-website-id="92207923-12de-43a6-8154-b4fc086418ed"
        data-project-name="VeBetter Relayers"
        data-project-color="#3DBA67"
        data-project-logo="https://prod-vechainkit-docs-images-bucket.s3.eu-west-1.amazonaws.com/robot-icon.svg"
        data-dark-mode={isDarkMode}
        data-button-hide="true"
        data-modal-title="VeBetter Relayers AI"
        data-modal-ask-ai-input-placeholder="Ask about relayers, auto-voting, rewards..."
        data-modal-example-questions="How does auto-voting work?,What are relayer rewards?,How do I register as a relayer?"
        strategy="afterInteractive"
      />
      <Button
        onClick={handleOpen}
        position="fixed"
        bottom="20px"
        right="20px"
        zIndex="199"
        rounded="full"
        px="16px"
        h="42px"
        bg="#C8F7D9"
        color="#2B8A3E"
        fontWeight="semibold"
        boxShadow="0 2px 12px rgba(61, 186, 103, 0.25)"
        _hover={{ bg: "#3DBA67", color: "white" }}
        transition="all 0.2s ease">
        <RobotIcon />
        {"Ask me"}
      </Button>
    </>
  )
}

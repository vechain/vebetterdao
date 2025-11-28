/**
 * Fix for vechain-kit modal jumping when mobile keyboard opens
 * Monitors viewport changes and keeps modal positioned correctly
 */

export function initVechainKitModalFix() {
  if (typeof window === "undefined") return

  // Only run on mobile devices
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (!isMobile) return

  const fixModalPosition = () => {
    const modalContainer = document.querySelector(".chakra-modal__content-container") as HTMLElement
    if (!modalContainer) return

    // Save original viewport height
    const viewportHeight = window.visualViewport?.height || window.innerHeight

    // Lock the modal container height to current viewport
    modalContainer.style.setProperty("height", `${viewportHeight}px`, "important")
    modalContainer.style.setProperty("position", "fixed", "important")
    modalContainer.style.setProperty("top", "0", "important")
    modalContainer.style.setProperty("left", "0", "important")
    modalContainer.style.setProperty("right", "0", "important")
    modalContainer.style.setProperty("overflow", "auto", "important")
  }

  // Monitor for modal opening
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains("chakra-modal__overlay") || node.querySelector(".chakra-modal__overlay")) {
            setTimeout(fixModalPosition, 100)
          }
        }
      })
    })
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Also listen to visual viewport changes (keyboard open/close)
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fixModalPosition)
  }
}


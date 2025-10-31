import { createContext, type ReactNode, useEffect, useState } from "react"

export interface OnboardingStep {
  id: string
  title: string
  description: string
  targetId: string
  placement?: "top" | "bottom" | "left" | "right"
}

interface OnboardingContextValue {
  currentStepIndex: number
  steps: OnboardingStep[]
  isActive: boolean
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  startTour: () => void
  resetTour: () => void
  getCurrentStep: () => OnboardingStep | undefined
}

export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

interface OnboardingProviderProps {
  children: ReactNode
  steps: OnboardingStep[]
  autoStart?: boolean
  storageKey: string
}

const getStorageKey = (key: string) => `onboarding_${key}`

export const OnboardingProvider = ({ children, steps, autoStart = false, storageKey }: OnboardingProviderProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isActive, setIsActive] = useState(() => {
    if (typeof window === "undefined") return autoStart
    const completed = localStorage.getItem(getStorageKey(storageKey))
    return completed === "true" ? false : autoStart
  })

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      skipTour()
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const skipTour = () => {
    setIsActive(false)
    setCurrentStepIndex(0)
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(storageKey), "true")
    }
  }

  const startTour = () => {
    setIsActive(true)
    setCurrentStepIndex(0)
  }

  const resetTour = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey(storageKey))
    }
    setCurrentStepIndex(0)
    setIsActive(true)
  }

  const getCurrentStep = () => steps[currentStepIndex]

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        skipTour()
      } else if (event.key === "ArrowRight") {
        nextStep()
      } else if (event.key === "ArrowLeft") {
        prevStep()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, currentStepIndex, steps.length])

  return (
    <OnboardingContext.Provider
      value={{
        currentStepIndex,
        steps,
        isActive,
        nextStep,
        prevStep,
        skipTour,
        startTour,
        resetTour,
        getCurrentStep,
      }}>
      {children}
    </OnboardingContext.Provider>
  )
}

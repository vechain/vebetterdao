import { useMemo } from "react"

type TitleCondition = {
  condition: boolean
  title: string
}

export const useConditionalTitle = (conditions: TitleCondition[], defaultTitle?: string) => {
  return useMemo(() => {
    const activeCondition = conditions.find(c => c.condition)
    return activeCondition?.title ?? defaultTitle
  }, [conditions, defaultTitle])
}

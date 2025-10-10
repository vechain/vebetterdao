import { queries, within, RenderOptions, RenderHookOptions, renderHook, render } from "@testing-library/react"
import { ReactElement } from "react"

import { AllTheProviders } from "./rtl.providers"

const allQueries = {
  ...queries,
}

const customScreen = within(document.body, allQueries)
const customWithin = (element: HTMLElement) => within(element, allQueries)
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "queries">) =>
  render(ui, { wrapper: AllTheProviders, queries: allQueries, ...options })

const customRenderHook = <Result, Props>(render: (props: Props) => Result, options?: RenderHookOptions<Props>) =>
  renderHook(render, {
    wrapper: AllTheProviders,
    queries: allQueries,
    ...options,
  })

// re-export everything
export * from "@testing-library/react"
// override render method
export { customScreen as screen, customWithin as within, customRender as render, customRenderHook as renderHook }

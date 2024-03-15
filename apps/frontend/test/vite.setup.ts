import "@testing-library/jest-dom"
import "vitest-canvas-mock" // avoid different errors like cannot read propery addEventListener of undefined
import ResizeObserver from "resize-observer-polyfill"
import { loadEnvConfig } from "@next/env"
import { cleanup } from "@testing-library/react"

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

//support testing dynamic imports
vi.mock("next/dynamic", async () => {
  const dynamicModule: any = await vi.importActual("next/dynamic")
  return {
    default: (loader: any) => {
      const dynamicActualComp = dynamicModule.default
      const RequiredComponent = dynamicActualComp(loader)
      RequiredComponent.preload ? RequiredComponent.preload() : RequiredComponent.render.preload()
      return RequiredComponent
    },
  }
})

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation")
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
    })),
    useSearchParams: vi.fn(() => ({
      // get: vi.fn(),
    })),
    usePathname: vi.fn(),
  }
})

loadEnvConfig(process.cwd())

// runs a cleanup after each test case (e.g. clearing jsdom) and reset the mock handlers
afterEach(() => {
  cleanup()
})

//needed to avoid errors when testing chart.js based components
global.ResizeObserver = ResizeObserver

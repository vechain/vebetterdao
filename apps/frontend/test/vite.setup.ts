import { loadEnvConfig } from "@next/env"

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

/* @ts-ignore */
// Mock for react-lottie-web
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillStyle: "",
    fillRect: vi.fn(),
  }
}

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

loadEnvConfig(process.cwd())

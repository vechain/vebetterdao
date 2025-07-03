import * as apiHooks from "@/api"
import dayjs from "dayjs"
import { fireEvent, render, screen } from "../../../../../test"
import { AllocationRoundNavbar } from "./AllocationRoundNavbar"
import * as chakra from "@chakra-ui/react"
import * as router from "next/navigation"

export const mockedUsePathname = vi.fn()
vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual("@chakra-ui/react")
  return {
    ...actual,
    useMediaQuery: vi.fn(() => [true]),
  }
})

const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})

const roundId = "1"
describe("AllocationRoundNavbar", () => {
  const voteStart = dayjs().subtract(1, "day")
  const voteEnd = dayjs().add(1, "day")
  beforeEach(() => {
    //@ts-ignore
    vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
      data: {
        state: 0,
        roundId: "1",
        isCurrent: true,
        voteStartTimestamp: voteStart,
        voteEndTimestamp: voteEnd,
        isFirstRound: true,
        isLastRound: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    })

    vi.useFakeTimers()
    vi.setSystemTime(dayjs().valueOf())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("desktop", () => {
    beforeEach(() => {
      vi.spyOn(chakra, "useMediaQuery").mockReturnValueOnce([true])
    })

    it("loading - renders correctly", async () => {
      //@ts-ignore
      vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
        data: {
          state: 0,
          roundId: undefined,
          isCurrent: false,
          voteStartTimestamp: dayjs(),
          voteEndTimestamp: dayjs().add(1, "day"),
          isFirstRound: true,
          isLastRound: false,
        },
        isLoading: true,
        isError: false,
        error: null,
      })

      render(<AllocationRoundNavbar roundId={roundId} />)

      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-desktop`)).toBeInTheDocument()
      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-mobile`)).not.toBeInTheDocument()

      await screen.findByText("Round #")
      expect(await screen.findAllByText("8 February")).toHaveLength(2)

      const prevButton = await screen.findByTestId("prev-round-button")
      const nextButton = await screen.findByTestId("next-round-button")
      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    }) // current round - renders correctly

    it("first round and current - renders correctly", async () => {
      render(<AllocationRoundNavbar roundId={roundId} />)

      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-desktop`)).toBeInTheDocument()
      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-mobile`)).not.toBeInTheDocument()

      await screen.findByText("Round #1")
      const prevButton = await screen.findByTestId("prev-round-button")
      const nextButton = await screen.findByTestId("next-round-button")
      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    }) // current round - renders correctly

    it("second round not current - renders correctly", async () => {
      //@ts-ignore
      vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
        data: {
          state: 0,
          roundId: "2",
          isCurrent: false,
          voteStartTimestamp: voteStart,
          voteEndTimestamp: voteEnd,
          isFirstRound: false,
          isLastRound: false,
        },
        isLoading: false,
        isError: false,
        error: null,
      })

      render(<AllocationRoundNavbar roundId={roundId} />)

      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-desktop`)).toBeInTheDocument()
      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-mobile`)).not.toBeInTheDocument()

      await screen.findByText("Round #2")

      await screen.findByText(voteStart.format("D MMMM"))
      await screen.findByText(voteEnd.format("D MMMM"))
      const prevButton = await screen.findByTestId("prev-round-button")
      const nextButton = await screen.findByTestId("next-round-button")
      expect(prevButton).toBeEnabled()
      expect(nextButton).toBeEnabled()

      fireEvent.click(prevButton)
      expect(mockRouterPush).toHaveBeenCalledWith("/rounds/1")
      mockRouterPush.mockClear()
      fireEvent.click(nextButton)
      expect(mockRouterPush).toHaveBeenCalledWith("/rounds/3")
    }) // current round - renders correctly
  }) // desktop

  describe("mobile", () => {
    beforeEach(() => {
      vi.spyOn(chakra, "useMediaQuery").mockReturnValueOnce([false])
    })

    it("loading - renders correctly", async () => {
      //@ts-ignore
      vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
        data: {
          state: 0,
          roundId: undefined,
          isCurrent: false,
          voteStartTimestamp: dayjs(),
          voteEndTimestamp: dayjs().add(1, "day"),
          isFirstRound: true,
          isLastRound: false,
        },
        isLoading: true,
        isError: false,
        error: null,
      })

      render(<AllocationRoundNavbar roundId={roundId} />)

      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-desktop`)).not.toBeInTheDocument()
      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-mobile`)).toBeInTheDocument()

      await screen.findByText("Round #0")
      expect(await screen.findAllByText("8 February")).toHaveLength(2)

      const prevButton = await screen.findByTestId("prev-round-button")
      const nextButton = await screen.findByTestId("next-round-button")
      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    }) // current round - renders correctly

    it("first round and current - renders correctly", async () => {
      render(<AllocationRoundNavbar roundId={roundId} />)

      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-desktop`)).not.toBeInTheDocument()
      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-mobile`)).toBeInTheDocument()

      await screen.findByText("Round #1")
      const prevButton = await screen.findByTestId("prev-round-button")
      const nextButton = await screen.findByTestId("next-round-button")
      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()

      await screen.findByText(voteStart.format("D MMMM"))
      await screen.findByText(voteEnd.format("D MMMM"))
    }) // current round - renders correctly

    it("second round not current - renders correctly", async () => {
      //@ts-ignore
      vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
        data: {
          state: 0,
          roundId: "2",
          isCurrent: false,
          voteStartTimestamp: voteStart,
          voteEndTimestamp: voteEnd,
          isFirstRound: false,
          isLastRound: false,
        },
        isLoading: false,
        isError: false,
        error: null,
      })

      render(<AllocationRoundNavbar roundId={roundId} />)

      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-desktop`)).not.toBeInTheDocument()
      expect(screen.queryByTestId(`allocation-round-${roundId}-nav-mobile`)).toBeInTheDocument()

      await screen.findByText("Round #2")
      const prevButton = await screen.findByTestId("prev-round-button")
      const nextButton = await screen.findByTestId("next-round-button")
      expect(prevButton).toBeEnabled()
      expect(nextButton).toBeEnabled()

      await screen.findByText(voteStart.format("D MMMM"))
      await screen.findByText(voteEnd.format("D MMMM"))

      fireEvent.click(prevButton)
      expect(mockRouterPush).toHaveBeenCalledWith("/rounds/1")
      mockRouterPush.mockClear()
      fireEvent.click(nextButton)
      expect(mockRouterPush).toHaveBeenCalledWith("/rounds/3")
    }) // current round - renders correctly
  }) // desktop
}) // AllocationRoundNavbar

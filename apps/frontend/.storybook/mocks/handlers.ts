import { http, HttpResponse } from "msw"

export const handlers = [
  http.get("*/api/v1/b3tr/actions/leaderboards/users", ({ request }) => {
    const url = new URL(request.url)
    const roundId = url.searchParams.get("roundId")

    return HttpResponse.json({
      data: [
        { wallet: "0x1234567890123456789012345678901234567890", actionsRewarded: 1000, roundId: Number(roundId) },
        { wallet: "0x2345678901234567890123456789012345678901", actionsRewarded: 950, roundId: Number(roundId) },
        { wallet: "0x3456789012345678901234567890123456789012", actionsRewarded: 900, roundId: Number(roundId) },
        { wallet: "0x4567890123456789012345678901234567890123", actionsRewarded: 850, roundId: Number(roundId) },
        { wallet: "0x5678901234567890123456789012345678901234", actionsRewarded: 800, roundId: Number(roundId) },
        { wallet: "0x6789012345678901234567890123456789012345", actionsRewarded: 750, roundId: Number(roundId) },
        { wallet: "0x7890123456789012345678901234567890123456", actionsRewarded: 700, roundId: Number(roundId) },
        { wallet: "0x8901234567890123456789012345678901234567", actionsRewarded: 650, roundId: Number(roundId) },
        { wallet: "0x9012345678901234567890123456789012345678", actionsRewarded: 600, roundId: Number(roundId) },
        { wallet: "0x0123456789012345678901234567890123456789", actionsRewarded: 550, roundId: Number(roundId) },
      ],
      pagination: { hasNext: false },
    })
  }),

  http.get("*/api/v1/b3tr/actions/users/:wallet/overview", () => {
    return HttpResponse.json({
      rankByActionsRewarded: 42,
      actionsRewarded: 350,
    })
  }),
]

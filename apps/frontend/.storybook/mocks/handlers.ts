import { http, HttpResponse } from "msw"

export const handlers = [
  http.get("*/api/v1/b3tr/actions/users/:wallet/overview", () => {
    return HttpResponse.json({
      rankByActionsRewarded: 42,
      actionsRewarded: 350,
    })
  }),
]

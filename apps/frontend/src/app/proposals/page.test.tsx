import { expect, test } from "vitest"

import { render, screen } from "../../../test"

import Proposals from "./page"

test("Proposals", async () => {
  render(<Proposals />)
  expect(await screen.findByTestId("proposals")).toBeInTheDocument()
})

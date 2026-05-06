import e2eConfig from "@repo/config/e2e"

import { baseUrl, localNodeUrl } from "../../src/config"
import { approveVeWorldTransaction, connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"
import {
  fillCreateChallengeForm,
  navigateToChallenges,
  openCreateChallengeModal,
  submitCreateChallenge,
} from "../../src/utils/challenges"
import { readChallenge, readChallengeCount } from "../../src/utils/contracts"
import { getTestWalletAddress } from "../../src/utils/wallet"

const STAKE_AMOUNT_B3TR = "100"
const EXPECTED_STAKE_WEI = 100n * 10n ** 18n

test("creates a challenge end-to-end and verifies on-chain", async ({ appPage, extensionPage }) => {
  test.setTimeout(240_000)
  const challengesAddr = e2eConfig.challengesContractAddress
  const walletAddr = getTestWalletAddress()

  await connectWithVeWorld(appPage, extensionPage)
  await navigateToChallenges(appPage, baseUrl)

  const idBefore = await readChallengeCount(localNodeUrl, challengesAddr)

  await openCreateChallengeModal(appPage)
  await fillCreateChallengeForm(appPage, { amount: STAKE_AMOUNT_B3TR })
  await submitCreateChallenge(appPage)
  await approveVeWorldTransaction(appPage, extensionPage)

  const idAfter = await readChallengeCount(localNodeUrl, challengesAddr)
  expect(idAfter).toBe(idBefore + 1n)

  const challenge = await readChallenge(localNodeUrl, challengesAddr, idAfter)
  expect(challenge.creator.toLowerCase()).toBe(walletAddr)
  expect(challenge.stakeAmount).toBe(EXPECTED_STAKE_WEI)
  expect(challenge.duration).toBe(1n)
  expect(challenge.allApps).toBe(true)
})

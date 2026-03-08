import { RelayerSummary, CycleResult } from "@/relayer/types"

// ANSI color helpers for xterm
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
  brightGreen: "\x1b[92m",
}

function formatB3TR(wei: bigint): string {
  const whole = wei / 10n ** 18n
  const frac = (wei % 10n ** 18n) / 10n ** 16n
  return `${whole}.${frac.toString().padStart(2, "0")} B3TR`
}

function formatVOT3(wei: bigint): string {
  const whole = wei / 10n ** 18n
  const frac = (wei % 10n ** 18n) / 10n ** 16n
  return `${whole}.${frac.toString().padStart(2, "0")} VOT3`
}

function shortAddr(addr: string): string {
  return addr.slice(0, 6) + "..." + addr.slice(-4)
}

function pct(num: bigint, den: bigint): string {
  if (den === 0n) return "—"
  return ((Number(num) / Number(den)) * 100).toFixed(2) + "%"
}

export function ts(): string {
  return `${c.gray}[${new Date().toLocaleTimeString()}]${c.reset}`
}

export function renderSummaryText(s: RelayerSummary): string[] {
  const out: string[] = []
  const div = `${c.dim}${"─".repeat(60)}${c.reset}`

  out.push("")
  out.push(`  ${c.cyan}${c.bold}VeBetterDAO Relayer Node${c.reset}`)
  out.push(`  ${div}`)
  out.push("")

  const reg = s.isRegistered ? `${c.green}Registered${c.reset}` : `${c.red}Not registered${c.reset}`
  out.push(
    `  ${c.dim}Network${c.reset}  ${c.bold}${c.white}${s.network}${c.reset}              ${c.dim}Block${c.reset} ${c.white}${s.latestBlock.toLocaleString()}${c.reset}`,
  )
  out.push(`  ${c.dim}Node${c.reset}     ${c.gray}${new URL(s.nodeUrl).hostname}${c.reset}`)
  out.push(`  ${c.dim}Address${c.reset}  ${c.yellow}${shortAddr(s.relayerAddress)}${c.reset}              ${reg}`)

  out.push("")
  out.push(`  ${div}`)
  out.push("")

  const roundStatus = s.isRoundActive ? `${c.green}Active${c.reset}` : `${c.dim}Ended${c.reset}`
  out.push(`  ${c.cyan}${c.bold}Round #${s.currentRoundId}${c.reset}  ${roundStatus}`)
  out.push(
    `  ${c.dim}Snapshot${c.reset}  ${c.white}${s.roundSnapshot}${c.reset}              ${c.dim}Deadline${c.reset}  ${c.white}${s.roundDeadline}${c.reset}`,
  )
  out.push(
    `  ${c.dim}Auto-voters${c.reset} ${c.bold}${c.white}${s.autoVotingUsers}${c.reset}              ${c.dim}Relayers${c.reset} ${c.bold}${c.white}${s.registeredRelayers.length}${c.reset}`,
  )
  out.push(
    `  ${c.dim}Voters${c.reset}      ${c.white}${s.totalVoters}${c.reset}              ${c.dim}Total${c.reset} ${c.cyan}${formatVOT3(s.totalVotes)}${c.reset}`,
  )

  out.push("")
  out.push(`  ${div}`)
  out.push("")

  const feeStr = s.feeDenominator > 0n ? pct(s.feePercentage, s.feeDenominator) : "—"
  out.push(
    `  ${c.dim}Vote Weight${c.reset}  ${c.bold}${c.white}${s.voteWeight}${c.reset}              ${c.dim}Claim Weight${c.reset} ${c.bold}${c.white}${s.claimWeight}${c.reset}`,
  )
  out.push(
    `  ${c.dim}Fee${c.reset}          ${c.yellow}${feeStr}${c.reset}              ${c.dim}Cap${c.reset} ${c.yellow}${formatB3TR(s.feeCap)}${c.reset}`,
  )
  out.push(`  ${c.dim}Early Access${c.reset} ${c.white}${s.earlyAccessBlocks}${c.reset}${c.dim} blocks${c.reset}`)

  out.push("")
  out.push(`  ${div}`)
  out.push("")

  out.push(`  ${c.cyan}${c.bold}This Round${c.reset}`)
  const completionPct = s.currentTotalWeighted > 0n ? pct(s.currentCompletedWeighted, s.currentTotalWeighted) : "—"
  const completionColor =
    s.currentTotalWeighted > 0n && s.currentCompletedWeighted >= s.currentTotalWeighted ? c.green : c.yellow
  const missedColor = s.currentMissedUsers > 0n ? c.red : c.green
  out.push(
    `  ${c.dim}Completion${c.reset} ${completionColor}${completionPct}${c.reset}              ${c.dim}Missed${c.reset} ${missedColor}${s.currentMissedUsers}${c.reset}`,
  )
  out.push(
    `  ${c.dim}Pool${c.reset}       ${c.green}${formatB3TR(s.currentTotalRewards)}${c.reset}              ${c.dim}Your share${c.reset} ${c.brightGreen}${c.bold}${formatB3TR(s.currentRelayerClaimable)}${c.reset}`,
  )
  out.push(
    `  ${c.dim}Actions${c.reset}    ${c.white}${s.currentRelayerActions}${c.reset}${c.dim} (wt: ${c.reset}${c.white}${s.currentRelayerWeighted}${c.reset}${c.dim})${c.reset}              ${c.dim}Total${c.reset} ${c.white}${s.currentTotalActions}${c.reset}`,
  )

  if (s.previousRoundId > 0) {
    out.push("")
    out.push(`  ${div}`)
    out.push("")
    const claimStatus = s.previousRewardClaimable ? `${c.green}Claimable${c.reset}` : `${c.dim}Not yet${c.reset}`
    out.push(`  ${c.cyan}${c.bold}Previous Round #${s.previousRoundId}${c.reset}`)
    out.push(
      `  ${c.dim}Pool${c.reset}       ${c.green}${formatB3TR(s.previousTotalRewards)}${c.reset}              ${c.dim}Your share${c.reset} ${c.brightGreen}${c.bold}${formatB3TR(s.previousRelayerClaimable)}${c.reset}`,
    )
    out.push(
      `  ${c.dim}Actions${c.reset}    ${c.white}${s.previousRelayerActions}${c.reset}              ${claimStatus}`,
    )
  }

  out.push("")
  return out
}

export function renderCycleResultText(r: CycleResult): string[] {
  const lines: string[] = []
  const label = r.phase === "vote" ? "Cast-vote" : "Claim"
  const dryTag = r.dryRun ? `${c.yellow} (DRY RUN)${c.reset}` : ""

  if (r.totalUsers === 0) {
    lines.push(`${label} round #${r.roundId}: ${c.dim}no users${c.reset}${dryTag}`)
    return lines
  }

  const ratio =
    r.successful === r.totalUsers
      ? `${c.green}${c.bold}${r.successful}/${r.totalUsers}${c.reset}`
      : `${c.yellow}${r.successful}/${r.totalUsers}${c.reset}`
  lines.push(`${label} round #${r.roundId}: ${ratio} successful${dryTag}`)

  if (r.failed.length > 0)
    lines.push(
      `${c.red}  ${r.failed.length} failed${c.reset}${c.gray} (${r.failed
        .slice(0, 3)
        .map(f => shortAddr(f.user))
        .join(", ")}${r.failed.length > 3 ? "..." : ""})${c.reset}`,
    )

  if (r.transient.length > 0) lines.push(`${c.yellow}  ${r.transient.length} transient failures${c.reset}`)

  if (r.txIds.length > 0 && !r.dryRun)
    lines.push(`${c.gray}  txs: ${r.txIds.map(t => t.slice(0, 10) + "...").join(", ")}${c.reset}`)

  return lines
}

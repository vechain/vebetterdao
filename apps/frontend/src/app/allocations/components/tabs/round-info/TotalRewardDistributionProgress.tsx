import { Progress, ProgressRootProps } from "@chakra-ui/react"

export const TotalRewardDistributionProgress = ({
  apps,
  voters,
  size = "sm",
}: {
  apps: number
  voters: number
  size?: ProgressRootProps["size"]
}) => {
  return (
    <Progress.Root
      size={size}
      value={100}
      css={{
        "--progress-green": "colors.status.positive.primary",
        "--progress-orange": "colors.status.warning.primary",
        "--progress-blue": "colors.status.info.strong",
      }}>
      <Progress.Track>
        <Progress.Range
          rounded="lg"
          css={{
            background: `linear-gradient(to right, var(--progress-green) 0%, var(--progress-green) ${apps}%, var(--progress-blue) ${apps}%, var(--progress-blue) ${apps + voters}%, var(--progress-orange) ${apps + voters}%, var(--progress-orange) 100%)`,
          }}
        />
      </Progress.Track>
    </Progress.Root>
  )
}

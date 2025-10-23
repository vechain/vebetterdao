type Props = {
  color?: string
}
export const VoteBoxIcon: React.FC<Props> = ({ color = "#004CFC" }) => {
  return (
    <svg width="80" height="81" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M45.2695 135.64V43H106.179"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M67.1797 90.66L85.8297 109.01C88.0597 111.2 91.7698 110.66 93.2798 107.92L126.1 45.53C126.92 43.98 128.52 43.01 130.27 43.01C132.87 43.01 134.98 45.12 134.98 47.72V135.64"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M26 136.27H154.25" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

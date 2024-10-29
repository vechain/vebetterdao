export const VoteCheckmarkIcon = ({ color = "#252525", size = "24" }: { color?: string; size?: string | number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.7}
      d="M27.83 81.478V25.894h36.545"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.7}
      d="m40.976 54.49 11.19 11.01a2.836 2.836 0 0 0 4.47-.655l19.692-37.434a2.827 2.827 0 0 1 5.328 1.314v52.752M16.267 81.856h76.95"
    />
  </svg>
)

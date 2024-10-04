type Props = {
  color?: string
}

export const HandPlantIcon: React.FC<Props> = ({ color = "#004CFC" }) => {
  return (
    <svg width="81" height="80" viewBox="0 0 81 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.6133 67.1911C14.9199 62.16 21.1022 59.2711 26.4399 60.72C29.6444 61.5911 32.3288 63.76 35.3911 65.0444C40.4444 67.1689 46.3066 66.7466 51.4577 64.8578C56.6044 62.9733 70.0444 56.4311 67.7466 52.7911C65.7244 49.5866 60.0355 51.5111 54.6933 53.8444"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M51.8985 34.4978C51.8985 34.4978 51.8984 12.9689 30.3207 12.9689C30.3207 12.9689 24.3518 40.3155 53.2896 41.3689C39.414 39.4 13.0273 51.1022 13.0273 51.1022C27.1785 45.8311 60.4496 44.3378 55.8629 52.9289C54.1963 56.0444 45.0407 52.9689 40.494 56.0133"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30.3203 12.9689C30.3203 12.9689 38.5426 23.3466 47.787 34.6489"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

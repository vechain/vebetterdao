type Props = {
  color?: string
}
export const ProposalIcon: React.FC<Props> = ({ color = "#004CFC" }) => {
  return (
    <svg width="79" height="78" viewBox="0 0 79 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M61.4728 37.6525V65.7455H17.3984V12.5669H50.3404L61.4728 25.9222H52.4161C52.3294 25.9222 52.2384 25.9222 52.1518 25.9179C46.7351 25.7359 43.8924 19.3789 47.2421 15.1192L49.2268 12.5929"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 56.3506C27.1147 54.0106 29.4634 51.5839 31.5737 49.2439C32.0417 48.7282 32.5227 48.1952 33.1813 47.8702C33.8357 47.5452 34.7153 47.4716 35.3177 47.8702C35.9113 48.2602 36.0803 49.0012 35.92 49.6339C35.7597 50.2666 35.3047 50.7995 34.919 51.3585C29.017 59.8865 36.037 56.2466 40.652 51.9176C40.2533 52.5936 39.8504 53.2869 39.729 54.0365C39.6077 54.7862 39.8287 55.6269 40.496 56.1122C41.4233 56.7839 43.1263 56.3506 43.3603 55.3192"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25 37.6523H61.2527" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 29.9995H44.4437" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

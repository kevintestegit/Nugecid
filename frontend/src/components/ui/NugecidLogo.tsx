import React from "react"

interface NugecidLogoProps {
  showText?: boolean
  className?: string
}

export const NugecidLogo: React.FC<NugecidLogoProps> = ({
  showText = true,
  className = "",
}) => {
  if (showText) {
    return (
      <svg
        viewBox="0 0 180 55"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="45"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="28"
          fontWeight="700"
          fill="currentColor"
          letterSpacing="0.5"
        >
          NUGECID
        </text>

        {/* Premium carnaval accent: minimalista, com traço limpo e destaque dourado */}
        <g transform="translate(-2, -2)">
          <path
            d="M 1 14 C 22 2, 58 2, 84 14"
            stroke="currentColor"
            strokeWidth="2.15"
            fill="none"
            strokeLinecap="round"
            opacity="0.86"
          />

          {/* Sombrinha 1 */}
          <path d="M 10.8 16.4 A 6.9 6.9 0 0 1 24.6 16.4 Z" fill="currentColor" opacity="0.95" />
          <path d="M 13.9 16.4 A 3.45 3.45 0 0 1 20.9 16.4 Z" fill="#F59E0B" opacity="0.96" />
          <path d="M 17.3 16.4 L 17.3 25.4" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
          <path d="M 17.3 25.4 Q 19.1 26.9 20.2 25.2" stroke="currentColor" strokeWidth="1.45" fill="none" strokeLinecap="round" />

          {/* Sombrinha 2 */}
          <path d="M 33.8 13.5 A 6.9 6.9 0 0 1 47.6 13.5 Z" fill="currentColor" opacity="0.95" />
          <path d="M 36.9 13.5 A 3.45 3.45 0 0 1 43.9 13.5 Z" fill="#F59E0B" opacity="0.96" />
          <path d="M 40.3 13.5 L 40.3 22.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
          <path d="M 40.3 22.5 Q 42.1 24 43.2 22.3" stroke="currentColor" strokeWidth="1.45" fill="none" strokeLinecap="round" />

          {/* Sombrinha 3 */}
          <path d="M 56.8 17.1 A 6.9 6.9 0 0 1 70.6 17.1 Z" fill="currentColor" opacity="0.95" />
          <path d="M 59.9 17.1 A 3.45 3.45 0 0 1 66.9 17.1 Z" fill="#F59E0B" opacity="0.96" />
          <path d="M 63.3 17.1 L 63.3 26.1" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
          <path d="M 63.3 26.1 Q 65.1 27.6 66.2 25.9" stroke="currentColor" strokeWidth="1.45" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    )
  }

  // Compact logo: "N" with carnival accent
  return (
    <svg
      viewBox="0 0 35 50"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="5"
        y="45"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill="currentColor"
      >
        N
      </text>

      <g transform="translate(-1, 2)">
        <path
          d="M 4 12 C 11 5.5, 20 5.5, 27 12"
          stroke="currentColor"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.86"
        />

        {/* Sombrinha compacta 1 premium */}
        <path d="M 5.4 13.2 A 3.8 3.8 0 0 1 13 13.2 Z" fill="currentColor" opacity="0.95" />
        <path d="M 7.2 13.2 A 1.9 1.9 0 0 1 11 13.2 Z" fill="#F59E0B" opacity="0.96" />
        <path d="M 9.1 13.2 L 9.1 18.2" stroke="currentColor" strokeWidth="0.96" strokeLinecap="round" />
        <path d="M 9.1 18.2 Q 10 19 10.5 18.1" stroke="currentColor" strokeWidth="0.96" fill="none" strokeLinecap="round" />

        {/* Sombrinha compacta 2 premium */}
        <path d="M 16.2 12.1 A 3.8 3.8 0 0 1 23.8 12.1 Z" fill="currentColor" opacity="0.95" />
        <path d="M 18 12.1 A 1.9 1.9 0 0 1 21.8 12.1 Z" fill="#F59E0B" opacity="0.96" />
        <path d="M 19.9 12.1 L 19.9 17.1" stroke="currentColor" strokeWidth="0.96" strokeLinecap="round" />
        <path d="M 19.9 17.1 Q 20.8 17.9 21.3 17" stroke="currentColor" strokeWidth="0.96" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

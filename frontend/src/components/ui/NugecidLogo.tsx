import React from "react"

interface NugecidLogoProps {
  showText?: boolean
  className?: string
}

// Versão com gorro "pendurado" na letra N
export const NugecidLogo: React.FC<NugecidLogoProps> = ({
  showText = true,
  className = "",
}) => {
  if (showText) {
    // Logo completa com touca apoiada e pendurada no "N"
    return (
      <svg
        viewBox="0 0 180 55"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Texto NUGECID */}
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

        {/* Gorro pendurado no "N" (ancorado na parte superior esquerda da letra) */}
        {/*
          Ideia geral:
          - Primeiro fazemos um pequeno translate para aproximar o gorro da letra.
          - Depois aplicamos uma rotação com centro na borda branca (a "base" do gorro),
            dando a sensação de que ele está pendurado e caindo para o lado.
        */}
        <g transform="translate(-5, 3) rotate(-28 10 22)">
          {/* Corpo da touca (triângulo vermelho) */}
          <path
            d="M 10 8 L 2 20 L 18 20 Z"
            fill="#DC2626"
            stroke="#B91C1C"
            strokeWidth="0.7"
          />

          {/* Borda branca da touca encostando na parte de cima do N */}
          <ellipse cx="10" cy="20" rx="10" ry="2.3" fill="#FFFFFF" />

          {/* Pompom branco, um pouco deslocado para baixo para parecer pendurado */}
          <circle cx="16.5" cy="10" r="3" fill="#FFFFFF" />

          {/* Sombra do pompom */}
          <ellipse
            cx="16.5"
            cy="11"
            rx="2.1"
            ry="1.2"
            fill="#E5E7EB"
            opacity="0.6"
          />

          {/* Detalhe de brilho na touca */}
          <path
            d="M 7 13 Q 10 14.2 13 13"
            stroke="#EF4444"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />
        </g>
      </svg>
    )
  }

  // Logo compacta (apenas "N" com o gorro pendurado)
  return (
    <svg
      viewBox="0 0 35 50"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Letra N */}
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

      {/*
        Para a versão compacta, usamos um ajuste mais fino no translate/rotate
        para o gorro parecer pendurado na "perna" esquerda do N.
      */}
      <g transform="translate(0, 5) rotate(-30 10 20)">
        {/* Corpo da touca (triângulo vermelho) */}
        <path
          d="M 10 8 L 2 20 L 18 20 Z"
          fill="#DC2626"
          stroke="#B91C1C"
          strokeWidth="0.7"
        />

        {/* Borda branca da touca */}
        <ellipse cx="10" cy="20" rx="10" ry="2.3" fill="#FFFFFF" />

        {/* Pompom branco um pouco mais baixo e à direita para dar sensação de queda */}
        <circle cx="17" cy="11" r="3" fill="#FFFFFF" />

        {/* Sombra do pompom */}
        <ellipse
          cx="17"
          cy="12"
          rx="2.1"
          ry="1.2"
          fill="#E5E7EB"
          opacity="0.6"
        />

        {/* Detalhe de brilho na touca */}
        <path
          d="M 7 13 Q 10 14.2 13 13"
          stroke="#EF4444"
          strokeWidth="1.2"
          fill="none"
          opacity="0.5"
        />
      </g>
    </svg>
  )
}

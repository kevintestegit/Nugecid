import React, { useId, useMemo } from "react";
import { calcularPascoa } from "@/constants/feriadosBR";

interface NugecidLogoProps {
  showText?: boolean;
  className?: string;
}

type LogoTheme = "easter" | "mothersDay" | "standard";

/**
 * Determina o tema ativo com base na data atual.
 */
const getActiveTheme = (date: Date): LogoTheme => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 1. Páscoa: De 15 dias antes até 3 dias depois
  const pascoa = calcularPascoa(year);
  const pascoaTime = pascoa.getTime();
  const currentTime = new Date(year, date.getMonth(), day).getTime();
  const diffDays = (currentTime - pascoaTime) / (1000 * 60 * 60 * 24);

  if (diffDays >= -15 && diffDays <= 3) {
    return "easter";
  }

  // 2. Dia das Mães: De 25 de abril até 15 de maio
  // (Cobre o período que antecede o segundo domingo de maio)
  if ((month === 4 && day >= 25) || (month === 5 && day <= 15)) {
    return "mothersDay";
  }

  return "standard";
};

export const NugecidLogo: React.FC<NugecidLogoProps> = ({
  showText = true,
  className = "",
}) => {
  const patternId = useId().replace(/:/g, "-");
  
  // Memoizamos o tema para evitar recalcular no render, embora seja leve
  const theme = useMemo(() => getActiveTheme(new Date()), []);

  // Definições de cores por tema
  const themeConfig = {
    easter: {
      colors: ["#60A5FA", "#F472B6", "#A78BFA", "#34D399", "#FBBF24", "#2DD4BF", "#818CF8"],
      patternStroke: "rgba(255, 255, 255, 0.4)",
      patternCircle: "rgba(255, 255, 255, 0.5)",
    },
    mothersDay: {
      colors: ["#F43F5E", "#EC4899", "#D946EF", "#A855F7", "#8B5CF6", "#6366F1", "#4F46E5"],
      patternStroke: "rgba(255, 255, 255, 0.3)",
      patternCircle: "rgba(255, 255, 255, 0.4)",
    },
    standard: {
      colors: ["#3B82F6", "#3B82F6", "#3B82F6", "#3B82F6", "#3B82F6", "#3B82F6", "#3B82F6"], // Azul institucional
      patternStroke: "rgba(255, 255, 255, 0.2)",
      patternCircle: "rgba(255, 255, 255, 0.3)",
    }
  }[theme];

  // Padrão de textura (zig-zags e bolinhas)
  const SharedDefs = () => (
    <defs>
      <pattern
        id={patternId}
        width="16"
        height="16"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(20)"
      >
        <path
          d="M 0 4 L 4 0 L 8 4 L 12 0 L 16 4"
          fill="none"
          stroke={themeConfig.patternStroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="11" r="1.5" fill={themeConfig.patternCircle} />
        <circle cx="0" cy="11" r="1" fill={themeConfig.patternStroke} />
      </pattern>
    </defs>
  );

  // Elementos da Páscoa
  const EasterElements = ({ compact = false }) => (
    <g transform={compact ? "translate(0, 5)" : "translate(0, 0)"}>
      <path
        d={compact ? "M 4 12 C 12 4, 20 4, 28 12" : "M 5 20 C 30 8, 60 8, 90 20"}
        stroke="#9CA3AF"
        strokeWidth={compact ? "1" : "1.5"}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={compact ? "2 2" : "4 4"}
        opacity="0.6"
      />
      <path
        d={compact ? "M 8 11 C 6 4, 11 1, 13 8 C 15 1, 20 4, 18 11 Z" : "M 12 18 C 10 10, 16 6, 18 14 C 20 6, 26 10, 24 18 Z"}
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="0.5"
      />
      <path
        d={compact ? "M 9.5 10 C 8.5 6, 10.5 4, 11.5 8 C 12.5 4, 14.5 6, 13.5 10 Z" : "M 13.5 17 C 12 12, 15 9, 16.5 15 C 18 9, 21 12, 19.5 17 Z"}
        fill="#F472B6"
        opacity="0.9"
      />
      {!compact && (
        <>
          <g transform="translate(35, 12) rotate(-15)">
            <ellipse cx="0" cy="0" rx="4.5" ry="6.5" fill="#60A5FA" opacity="0.9" />
            <path d="M -4 0 Q 0 3 4 0" stroke="#FFF" strokeWidth="1" fill="none" />
          </g>
          <g transform="translate(55, 9) rotate(10)">
            <ellipse cx="0" cy="0" rx="5" ry="7" fill="#FBBF24" opacity="0.9" />
            <path d="M -4.5 0 Q 0 -3 4.5 0" stroke="#FFF" strokeWidth="1" fill="none" />
            <circle cx="0" cy="3" r="1" fill="#FFF" />
          </g>
          <g transform="translate(75, 14) rotate(-10)">
            <ellipse cx="0" cy="0" rx="4" ry="5.5" fill="#A78BFA" opacity="0.9" />
            <path d="M -3.5 -1 L 3.5 -1 M -3.5 1 L 3.5 1" stroke="#FFF" strokeWidth="0.8" fill="none" />
          </g>
        </>
      )}
      {compact && (
        <g transform="translate(23, 8) rotate(15)">
          <ellipse cx="0" cy="0" rx="3" ry="4.5" fill="#60A5FA" opacity="0.9" />
          <path d="M -2.5 0 Q 0 1.5 2.5 0" stroke="#FFF" strokeWidth="0.5" fill="none" />
        </g>
      )}
    </g>
  );

  // Elementos do Dia das Mães
  const MothersDayElements = ({ compact = false }) => (
    <g transform={compact ? "translate(0, 0)" : "translate(0, 0)"}>
      {/* Coração 1 (Principal) */}
      <g transform={compact ? "translate(22, 15) scale(1.2)" : "translate(18, 12) scale(1.5)"}>
        <path
          d="M 0 -2 C -1 -4, -3 -4, -4 -2 C -4 1, 0 4, 0 4 C 0 4, 4 1, 4 -2 C 3 -4, 1 -4, 0 -2"
          fill="#F43F5E"
          opacity="0.9"
        />
      </g>
      {!compact && (
        <>
          {/* Coração 2 */}
          <g transform="translate(45, 18) rotate(-15) scale(1.2)">
            <path
              d="M 0 -2 C -1 -4, -3 -4, -4 -2 C -4 1, 0 4, 0 4 C 0 4, 4 1, 4 -2 C 3 -4, 1 -4, 0 -2"
              fill="#EC4899"
              opacity="0.8"
            />
          </g>
          {/* Coração 3 */}
          <g transform="translate(70, 10) rotate(15)">
            <path
              d="M 0 -2 C -1 -4, -3 -4, -4 -2 C -4 1, 0 4, 0 4 C 0 4, 4 1, 4 -2 C 3 -4, 1 -4, 0 -2"
              fill="#D946EF"
              opacity="0.8"
            />
          </g>
          {/* Raminho de Flor Simbólico */}
          <path
            d="M 90 25 Q 95 15, 105 20 M 105 20 L 103 15 M 105 20 L 110 18"
            stroke="#10B981"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
        </>
      )}
    </g>
  );

  if (showText) {
    return (
      <svg
        viewBox="0 0 180 55"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <SharedDefs />

        {/* 1. TEXTO BASE COLORIDO */}
        <text
          x="0"
          y="45"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="28"
          fontWeight="700"
          letterSpacing="0.5"
        >
          {"NUGECID".split("").map((char, i) => (
            <tspan key={i} fill={themeConfig.colors[i]}>
              {char}
            </tspan>
          ))}
        </text>

        {/* 2. OVERLAY DO PADRÃO */}
        <text
          x="0"
          y="45"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="28"
          fontWeight="700"
          letterSpacing="0.5"
          fill={`url(#${patternId})`}
          style={{ pointerEvents: "none" }}
        >
          NUGECID
        </text>

        {/* Elementos Decorativos Condicionais */}
        {theme === "easter" && <EasterElements />}
        {theme === "mothersDay" && <MothersDayElements />}
      </svg>
    );
  }

  // Logo Compacta (Apenas o N)
  return (
    <svg
      viewBox="0 0 35 50"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <SharedDefs />

      {/* Letra N Base */}
      <text
        x="5"
        y="45"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill={themeConfig.colors[0]}
      >
        N
      </text>

      {/* Letra N Textura Overlay */}
      <text
        x="5"
        y="45"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill={`url(#${patternId})`}
        style={{ pointerEvents: "none" }}
      >
        N
      </text>

      {/* Elementos Decorativos Condicionais Compactos */}
      {theme === "easter" && <EasterElements compact />}
      {theme === "mothersDay" && <MothersDayElements compact />}
    </svg>
  );
};

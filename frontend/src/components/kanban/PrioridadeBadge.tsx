import React from "react";
import { AlertCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  getPrioridadeCor,
  getPrioridadeLabel,
} from "../../utils/kanbanHelpers";

interface PrioridadeBadgeProps {
  prioridade: "baixa" | "media" | "alta" | "critica";
  size?: "sm" | "md";
  showIcon?: boolean;
  showLabel?: boolean;
}

export const PrioridadeBadge: React.FC<PrioridadeBadgeProps> = ({
  prioridade,
  size = "sm",
  showIcon = true,
  showLabel = true,
}) => {
  const cor = getPrioridadeCor(prioridade);
  const label = getPrioridadeLabel(prioridade);

  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  const iconSize = size === "sm" ? 12 : 14;

  const Icon = {
    critica: AlertCircle,
    alta: ArrowUp,
    media: Minus,
    baixa: ArrowDown,
  }[prioridade];

  // Cor de fundo mais clara
  const bgColor = cor + "20"; // Adiciona transparência

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses}`}
      style={{
        backgroundColor: bgColor,
        color: cor,
        borderColor: cor + "40",
      }}
    >
      {showIcon && <Icon size={iconSize} />}
      {showLabel && <span>{label}</span>}
    </div>
  );
};

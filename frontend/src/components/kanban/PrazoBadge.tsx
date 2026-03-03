import React from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { calcularPrazoStatus } from "../../utils/kanbanHelpers";
import { PrazoStatus } from "../../types/kanban.types";

interface PrazoBadgeProps {
  prazo?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const PrazoBadge: React.FC<PrazoBadgeProps> = ({
  prazo,
  size = "sm",
  showIcon = true,
}) => {
  if (!prazo) return null;

  const prazoInfo = calcularPrazoStatus(prazo);

  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  const iconSize = size === "sm" ? 12 : 14;

  const bgColor = {
    [PrazoStatus.OK]: "bg-green-100 text-green-700 border-green-200",
    [PrazoStatus.PROXIMO]: "bg-yellow-100 text-yellow-700 border-yellow-200",
    [PrazoStatus.ATRASADO]: "bg-red-100 text-red-700 border-red-200",
    [PrazoStatus.SEM_PRAZO]: "bg-gray-100 text-gray-600 border-gray-200",
  }[prazoInfo.status];

  const Icon =
    prazoInfo.status === PrazoStatus.ATRASADO ? AlertCircle : Calendar;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${bgColor}`}
    >
      {showIcon && <Icon size={iconSize} />}
      <span>{prazoInfo.label}</span>
    </div>
  );
};

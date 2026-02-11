import React from "react";
import { Usuario } from "../../types/kanban.types";
import { getInitials, getAvatarColor } from "../../utils/kanbanHelpers";

interface AvatarProps {
  usuario?: Usuario;
  size?: "xs" | "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
};

export const Avatar: React.FC<AvatarProps> = ({
  usuario,
  size = "sm",
  showTooltip = true,
  className,
}) => {
  if (!usuario) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold`}
        title={showTooltip ? "Sem responsável" : undefined}
      >
        <svg className="w-2/3 h-2/3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  const displayName = usuario.nome ?? usuario.usuario ?? "Usuario";
  const avatarColor = getAvatarColor(displayName);
  const initials = getInitials(displayName);
  const avatarSrc = usuario.avatarUrl ?? usuario.avatar;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-sm ${className ?? ""}`}
      style={{ backgroundColor: avatarColor }}
      title={showTooltip ? displayName : undefined}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={displayName}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

interface AvatarGroupProps {
  usuarios: Usuario[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  usuarios,
  max = 3,
  size = "sm",
}) => {
  const visibleUsuarios = usuarios.slice(0, max);
  const remainingCount = usuarios.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleUsuarios.map((usuario) => (
        <div key={usuario.id} className="ring-2 ring-white rounded-full">
          <Avatar usuario={usuario} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold ring-2 ring-white`}
          title={`+${remainingCount} outros`}
        >
          <span className="text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

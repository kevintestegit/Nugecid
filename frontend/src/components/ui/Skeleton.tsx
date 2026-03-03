import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
  animation = "pulse",
}) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]",
    none: "",
  };

  const style: React.CSSProperties = {
    width: width || (variant === "text" ? "100%" : undefined),
    height:
      height ||
      (variant === "text" ? "1em" : variant === "circular" ? "40px" : "20px"),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

// Skeleton para Card completo
interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = "",
  showImage = true,
  lines = 3,
}) => {
  return (
    <div
      className={`bg-background border border-border rounded-lg p-4 space-y-4 ${className}`}
    >
      {showImage && <Skeleton variant="rounded" height={200} />}
      <div className="space-y-2">
        <Skeleton variant="text" height={24} width="60%" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            height={16}
            width={i === lines - 1 ? "80%" : "100%"}
          />
        ))}
      </div>
    </div>
  );
};

// Skeleton para Lista
interface SkeletonListProps {
  items?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={16} width="40%" />
            <Skeleton variant="text" height={14} width="60%" />
          </div>
          <Skeleton variant="rounded" width={60} height={24} />
        </div>
      ))}
    </div>
  );
};

// Skeleton para Tabela
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = "",
}) => {
  return (
    <div
      className={`bg-background border border-border rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-border p-4">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" height={16} width="80%" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  height={14}
                  width="70%"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton para Stats Card
export const SkeletonStatsCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div
      className={`bg-background border border-border rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" width={80} height={32} className="mb-2" />
      <Skeleton variant="text" width={150} height={14} />
    </div>
  );
};

// Skeleton para Kanban Card
export const SkeletonKanbanCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div
      className={`bg-background border border-border rounded-lg p-4 space-y-3 ${className}`}
    >
      <Skeleton variant="text" height={18} width="80%" />
      <Skeleton variant="text" height={14} width="100%" />
      <Skeleton variant="text" height={14} width="60%" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="rounded" width={60} height={20} />
      </div>
    </div>
  );
};

export default Skeleton;

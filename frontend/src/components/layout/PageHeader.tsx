import React from "react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center text-xs text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center">
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "hover:text-foreground/90 transition-colors",
                    !item.onClick &&
                      "cursor-default hover:text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
                {index < breadcrumb.length - 1 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
              </div>
            ))}
          </nav>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
};

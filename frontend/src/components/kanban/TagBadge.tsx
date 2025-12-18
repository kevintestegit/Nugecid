import React from 'react';
import { X } from 'lucide-react';
import { getTagColor } from '../../utils/kanbanHelpers';
import { cn } from '../../lib/utils';

interface TagBadgeProps {
  tag: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'modern';
  removable?: boolean;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  size = 'sm',
  variant = 'default',
  removable = false,
  onRemove,
}) => {
  const color = getTagColor(tag);
  
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  if (variant === 'modern') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
          sizeClasses[size]
        )}
      >
        {tag}
        {removable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X size={10} />
          </button>
        )}
      </span>
    );
  }

  // Default colorful style
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-white shadow-sm",
        sizeClasses[size]
      )}
      style={{ backgroundColor: color }}
    >
      {tag}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

interface TagListProps {
  tags: string[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'modern';
}

export const TagList: React.FC<TagListProps> = ({ 
  tags, 
  max = 3,
  size = 'sm',
  variant = 'default',
}) => {
  const visibleTags = tags.slice(0, max);
  const remainingCount = tags.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag, index) => (
        <TagBadge key={`${tag}-${index}`} tag={tag} size={size} variant={variant} />
      ))}
      {remainingCount > 0 && (
        <span 
          className={cn(
            "inline-flex items-center font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
            variant === 'modern' ? "rounded-md" : "rounded-full bg-gray-200 text-gray-700",
            size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : (size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1')
          )}
          title={tags.slice(max).join(', ')}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

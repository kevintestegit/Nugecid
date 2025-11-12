import React from 'react';
import { X } from 'lucide-react';
import { getTagColor } from '../../utils/kanbanHelpers';

interface TagBadgeProps {
  tag: string;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  size = 'sm',
  removable = false,
  onRemove,
}) => {
  const color = getTagColor(tag);
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${sizeClasses}`}
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
  size?: 'sm' | 'md';
}

export const TagList: React.FC<TagListProps> = ({ 
  tags, 
  max = 3,
  size = 'sm',
}) => {
  const visibleTags = tags.slice(0, max);
  const remainingCount = tags.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag, index) => (
        <TagBadge key={`${tag}-${index}`} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <span 
          className={`inline-flex items-center rounded-full bg-gray-200 text-gray-700 font-medium ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}`}
          title={tags.slice(max).join(', ')}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

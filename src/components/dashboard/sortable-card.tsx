'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableCard({ id, children, className }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative', className, isDragging ? 'opacity-50' : '')}
    >
      <div {...attributes} {...listeners} className="absolute top-3 right-3 p-2 cursor-grab text-muted-foreground hover:bg-muted rounded-md active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </div>
      {children}
    </div>
  );
}

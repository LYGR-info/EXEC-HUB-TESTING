import React from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 mt-1">{children}</div>}
    </div>
  );
}

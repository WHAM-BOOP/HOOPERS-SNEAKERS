import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13.5px] text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

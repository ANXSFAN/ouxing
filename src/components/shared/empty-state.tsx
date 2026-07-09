import { LucideIcon, InboxIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#86868b]" />
      </div>
      <h3 className="text-lg font-medium text-[#1d1d1f]">{title}</h3>
      {description && (
        <p className="text-sm text-[#6e6e73] mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

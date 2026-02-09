import { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: { label: string; color?: string };
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "ghost" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  onClick?: () => void;
};

export default function Card({ 
  title, 
  subtitle, 
  icon,
  badge,
  actions, 
  children, 
  className = "",
  variant = "default",
  padding = "md",
  interactive = false,
  onClick,
}: CardProps) {
  const baseStyles = "rounded-[18px] transition-all duration-200";
  
  const variantStyles = {
    default: "bg-white border border-slate-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
    ghost: "bg-transparent",
    bordered: "bg-white border border-slate-200",
    elevated: "bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-slate-100",
  };
  
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  
  const interactiveStyles = interactive || onClick
    ? "cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
    : "";

  return (
    <div 
      className={`
        ${baseStyles} 
        ${variantStyles[variant]} 
        ${paddingStyles[padding]} 
        ${interactiveStyles}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || icon || badge || actions) && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon && (
              <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-[17px] font-semibold text-slate-900 leading-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {badge && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.color || "bg-slate-100 text-slate-600"}`}>
                {badge.label}
              </span>
            )}
            {actions}
          </div>
        </div>
      )}
      <div className="text-[15px] text-slate-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// Specialized card variants
export function StatCard({ 
  label, 
  value, 
  change, 
  icon,
  className = "" 
}: { 
  label: string;
  value: string | number;
  change?: { value: string; positive?: boolean };
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-xl bg-white border border-slate-200/60 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {change && (
          <span className={`text-xs font-medium mb-1 ${change.positive ? "text-emerald-600" : "text-rose-600"}`}>
            {change.positive ? "↑" : "↓"} {change.value}
          </span>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-6 rounded-[18px] bg-white border border-slate-200/60 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 shimmer" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-slate-100 rounded shimmer mb-2" />
          <div className="h-3 w-24 bg-slate-100 rounded shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded shimmer" />
        <div className="h-3 bg-slate-100 rounded shimmer w-4/5" />
        <div className="h-3 bg-slate-100 rounded shimmer w-3/5" />
      </div>
    </div>
  );
}

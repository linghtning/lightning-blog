import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
export function Textarea({ className, ...props }) {
    return (_jsx("textarea", { className: cn('flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className), ...props }));
}

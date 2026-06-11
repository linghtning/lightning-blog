import { jsx as _jsx } from "react/jsx-runtime";
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-red-500 text-white hover:bg-red-600',
            outline: 'border border-border bg-transparent hover:bg-card text-foreground',
            secondary: 'bg-card text-foreground hover:bg-card/80',
            ghost: 'hover:bg-card text-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 px-3',
            lg: 'h-11 px-8',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
export function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? Slot : 'button';
    return (_jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ...props }));
}

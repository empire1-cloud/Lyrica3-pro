import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── shadcn buttonVariants ──
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ── shadcn Button (used by sidebar, alert-dialog, etc.) ──
interface ShadButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ShadButton = React.forwardRef<HTMLButtonElement, ShadButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref as any}
        {...props}
      />
    );
  }
);
ShadButton.displayName = "ShadButton";

// ── Custom glow Button (used by app pages) ──
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  glowColor?: 'cyan' | 'magenta' | 'purple' | 'fuchsia';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', glowColor = 'magenta', children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-full transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95 whitespace-nowrap";

    const variants: Record<string, string> = {
      primary: cn(
        "bg-zinc-900 border border-zinc-800 text-white",
        glowColor === 'cyan' && "hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:border-cyan-500",
        glowColor === 'magenta' && "hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:border-fuchsia-500",
        glowColor === 'purple' && "hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:border-purple-500",
        glowColor === 'fuchsia' && "hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:border-fuchsia-500"
      ),
      secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
      ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
      destructive: "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20"
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-4 text-xs",
      md: "h-10 px-6 text-sm",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props as any}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { ShadButton };

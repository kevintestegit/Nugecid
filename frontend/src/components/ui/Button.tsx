import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive group relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-modern-md hover:shadow-modern-lg hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/10",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-modern-md hover:shadow-modern-lg hover:scale-105 active:scale-95 focus-visible:ring-red-500/20 backdrop-blur-sm border border-white/10",
        outline:
          "border-2 border-border/50 bg-background/80 shadow-modern-sm hover:bg-accent/80 hover:text-accent-foreground hover:shadow-modern-md hover:scale-102 active:scale-98 backdrop-blur-sm",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-modern-sm hover:shadow-modern-md hover:scale-102 active:scale-98 backdrop-blur-sm",
        ghost:
          "hover:bg-accent/80 hover:text-accent-foreground hover:shadow-modern-sm hover:scale-102 active:scale-98 backdrop-blur-sm rounded-xl",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors duration-200",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

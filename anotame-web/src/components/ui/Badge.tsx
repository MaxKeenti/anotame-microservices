import * as React from "react";

import { cn } from "@/lib/utils";

// Note: I am not using cva lib yet as it wasn't requested in dependencies, 
// so I will implement a simpler version using just maps or switch for now, 
// OR I can just install cva. 
// Given the plan didn't explicitly ask for cva, I'll stick to simple cn + maps to keep it dependency-light 
// or I can manually implement the variant logic. 
// Actually, `cva` is very standard in shadcn usage. 
// But strictly following the plan: the plan said "Install clsx, tailwind-merge". 
// So I will implement Badge without `cva` to avoid extra deps not in plan.

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };

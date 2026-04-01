import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-4",
        lg: "h-12 w-12 border-4",
    };

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
                "text-primary",
                sizeClasses[size],
                className
            )}
            role="status"
            {...props}
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

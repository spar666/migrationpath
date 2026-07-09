import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-soft-sm hover:shadow-navy-glow hover:-translate-y-0.5 shimmer-hover",
                destructive: "bg-destructive text-destructive-foreground shadow-soft-sm hover:bg-destructive/90",
                outline: "border border-border bg-card hover:bg-muted hover:border-glacier/50",
                secondary: "bg-muted text-foreground border border-border hover:bg-muted/80 hover:border-glacier/40",
                ghost: "hover:bg-muted hover:text-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                accent: "bg-accent text-accent-foreground shadow-soft-sm hover:shadow-gold-glow hover:-translate-y-0.5 font-bold",
                elite: "bg-primary text-primary-foreground shadow-soft-md shimmer-hover hover:shadow-navy-glow hover:-translate-y-0.5",
                gold: "gradient-gold text-navy font-bold shadow-soft-sm hover:shadow-gold-glow hover:-translate-y-0.5",
            },
            size: {
                default: "h-11 px-5 py-2.5",
                sm: "h-9 rounded-md px-4",
                lg: "h-12 rounded-lg px-8 text-base",
                xl: "h-14 rounded-lg px-10 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

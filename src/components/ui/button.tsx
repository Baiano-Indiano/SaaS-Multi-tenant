"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useRef } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

import { Loader2 } from "lucide-react"

export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  "data-slot"?: string | null;
  isLoading?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  "data-slot": dataSlot,
  isLoading = false,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const isReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isDisabled = props.disabled || isLoading;

  useGSAP(() => {
    if (isReducedMotion()) return;

    if (isLoading) {
      // Premium transition to loading
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.15,
        ease: "power2.in",
      });
      gsap.fromTo(loaderRef.current, 
        { opacity: 0, y: 8, scale: 0.8 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.25, 
          delay: 0.1,
          ease: "back.out(1.7)" 
        }
      );
    } else {
      // Transition back to content
      gsap.to(loaderRef.current, {
        opacity: 0,
        y: 8,
        scale: 0.8,
        duration: 0.15,
        ease: "power2.in",
      });
      gsap.to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        delay: 0.1,
        ease: "power2.out",
      });
    }
  }, { dependencies: [isLoading], scope: containerRef });

  return (
    <ButtonPrimitive
      ref={containerRef}
      data-slot={dataSlot ?? "button"}
      className={cn(buttonVariants({ variant, size, className }), "relative")}
      disabled={isDisabled}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (isReducedMotion() || isDisabled) return;
        gsap.to(event.currentTarget, {
          scale: 0.97,
          duration: 0.08,
          ease: "power2.out",
          overwrite: "auto",
        });
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (isReducedMotion() || isDisabled) return;
        gsap.to(event.currentTarget, {
          scale: 1,
          duration: 0.14,
          ease: "power2.out",
          overwrite: "auto",
        });
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (isReducedMotion() || isDisabled) return;
        gsap.to(event.currentTarget, {
          scale: 1,
          duration: 0.16,
          ease: "power2.out",
          overwrite: "auto",
        });
      }}
      onClick={(event) => {
        onClick?.(event);
        if (isReducedMotion() || isDisabled) return;
        gsap.fromTo(
          event.currentTarget,
          { scale: 1 },
          {
            scale: 1.03,
            duration: 0.12,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            overwrite: "auto",
          }
        );
      }}
      {...props}
    >
      <span 
        ref={contentRef}
        className="flex items-center justify-center gap-2"
      >
        {children}
      </span>
      <div 
        ref={loaderRef}
        className="absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }


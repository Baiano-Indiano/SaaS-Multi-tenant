"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useRef } from "react"

import { cn } from "@/lib/utils"

import { buttonVariants, type ButtonVariantProps } from "./button-variants"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends ButtonPrimitive.Props, ButtonVariantProps {
  "data-slot"?: string | null;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
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
    },
    ref
  ) => {
    const contentRef = useRef<HTMLSpanElement>(null)
    const loaderRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const setRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      },
      [ref]
    )

    const isReducedMotion = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const isDisabled = props.disabled || isLoading

    useGSAP(
      () => {
        if (isReducedMotion()) return

        if (isLoading) {
          // Premium transition to loading
          gsap.to(contentRef.current, {
            opacity: 0,
            y: -8,
            duration: 0.15,
            ease: "power2.in",
          })
          gsap.fromTo(
            loaderRef.current,
            { opacity: 0, y: 8, scale: 0.8 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.25,
              delay: 0.1,
              ease: "back.out(1.7)",
            }
          )
        } else {
          // Transition back to content
          gsap.to(loaderRef.current, {
            opacity: 0,
            y: 8,
            scale: 0.8,
            duration: 0.15,
            ease: "power2.in",
          })
          gsap.to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.25,
            delay: 0.1,
            ease: "power2.out",
          })
        }
      },
      { dependencies: [isLoading], scope: buttonRef }
    )

    return (
      <ButtonPrimitive
        ref={setRef}
        data-slot={dataSlot ?? "button"}
        className={cn(buttonVariants({ variant, size, className }), "relative")}
        disabled={isDisabled}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (isReducedMotion() || isDisabled) return
          gsap.to(event.currentTarget, {
            scale: 0.98,
            duration: 0.08,
            ease: "power2.out",
            overwrite: "auto",
          })
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event)
          if (isReducedMotion() || isDisabled) return
          gsap.to(event.currentTarget, {
            scale: 1,
            duration: 0.14,
            ease: "power2.out",
            overwrite: "auto",
          })
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          if (isReducedMotion() || isDisabled) return
          gsap.to(event.currentTarget, {
            scale: 1,
            duration: 0.16,
            ease: "power2.out",
            overwrite: "auto",
          })
        }}
        onClick={(event) => {
          onClick?.(event)
          if (isReducedMotion() || isDisabled) return
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
          )
        }}
        {...props}
      >
        <span ref={contentRef} className="flex items-center justify-center gap-2">
          {children}
        </span>
        <div
          ref={loaderRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </ButtonPrimitive>
    )
  }
)
Button.displayName = "Button"


export { Button, buttonVariants }


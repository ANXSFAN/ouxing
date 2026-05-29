"use client";

import { useEffect, useRef, type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface Props {
  as?: ElementType;
  variant?: "up" | "fade" | "rise";
  delay?: number;
  className?: string;
  children: ReactNode;
  threshold?: number;
  once?: boolean;
}

/**
 * IntersectionObserver-based reveal. Sets `data-revealed="true"` when in view.
 * Use sparingly — these are subtle fade-ups, not theatrical reveals.
 */
export function ScrollReveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className,
  children,
  threshold = 0.15,
  once = true,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.setAttribute("data-revealed", "true");
    };

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal();
            if (once) io.unobserve(e.target);
          } else if (!once) {
            (e.target as HTMLElement).removeAttribute("data-revealed");
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  return (
    <Tag
      ref={ref as never}
      data-reveal={variant}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

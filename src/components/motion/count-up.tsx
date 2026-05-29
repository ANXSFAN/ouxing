"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  to: number;
  /** Suffix appended after the number (e.g. "+", "%", "年") */
  suffix?: string;
  /** Prefix prepended before the number */
  prefix?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Decimal places */
  decimals?: number;
  className?: string;
}

/**
 * IntersectionObserver-driven number counter. Starts when scrolled into view.
 */
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1600,
  decimals = 0,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const t0 = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic

      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        setValue(ease(t) * to);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(to);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            start();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const formatted = value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <span ref={ref} className={cn("tabular-nums inline-block", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Wires up wheel + touch listeners on `.snap-stack` so each gesture advances
 * exactly one page, while still allowing internal scroll inside a section
 * whose content exceeds one viewport.
 *
 * Behavior:
 *  - If the current section can still scroll in the gesture direction → let
 *    the browser handle it natively.
 *  - If the section is at its top/bottom edge → preventDefault and animate
 *    one page in the gesture direction (capped at one page per gesture).
 */
export function SnapStackController() {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(".snap-stack");
    if (!host) return;

    // On touch / small screens we let the browser scroll natively (see the
    // matching @media block in globals.css). Hijacking touch here makes mobile
    // swiping feel laborious, so bail out entirely on those devices.
    if (window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) {
      return;
    }

    const NAV_OFFSET = 44;
    const ANIM_MS = 650;
    const WHEEL_THRESHOLD = 6;
    const TOUCH_THRESHOLD = 50;
    const EDGE_EPSILON = 2;

    const pageHeight = () => host.clientHeight - NAV_OFFSET;
    const sections = () =>
      Array.from(host.querySelectorAll<HTMLElement>(".snap-page"));

    let isAnimating = false;
    let touchStartY = 0;
    let touchStartScroll = 0;

    const getCurrentSection = (): HTMLElement | null => {
      const ph = pageHeight();
      const idx = Math.round(host.scrollTop / ph);
      return sections()[idx] ?? null;
    };

    const sectionCanScroll = (
      section: HTMLElement | null,
      direction: 1 | -1,
    ): boolean => {
      if (!section) return false;
      const maxScroll = section.scrollHeight - section.clientHeight;
      if (maxScroll <= EDGE_EPSILON) return false; // section fits in 1 page
      if (direction === 1) {
        return section.scrollTop < maxScroll - EDGE_EPSILON;
      }
      return section.scrollTop > EDGE_EPSILON;
    };

    const animateTo = (target: number) => {
      isAnimating = true;
      host.scrollTo({ top: target, behavior: "smooth" });
      window.setTimeout(() => {
        isAnimating = false;
      }, ANIM_MS);
    };

    const goRelative = (dir: 1 | -1) => {
      const ph = pageHeight();
      const current = Math.round(host.scrollTop / ph);
      const next = current + dir;
      const max = host.scrollHeight - host.clientHeight;
      animateTo(Math.max(0, Math.min(max, next * ph)));
    };

    const onWheel = (e: WheelEvent) => {
      if (isAnimating) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      const section = getCurrentSection();

      if (sectionCanScroll(section, dir)) {
        // let the browser natively scroll within the section
        return;
      }

      e.preventDefault();
      goRelative(dir);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimating) return;
      touchStartY = e.touches[0].clientY;
      touchStartScroll = host.scrollTop;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isAnimating) {
        e.preventDefault();
        return;
      }
      const currentY = e.touches[0].clientY;
      const rawDy = touchStartY - currentY;
      const dir: 1 | -1 = rawDy > 0 ? 1 : -1;
      const section = getCurrentSection();

      if (sectionCanScroll(section, dir)) {
        // section still has room — let native touch scroll it
        return;
      }

      // section is at edge → preventDefault and drag host one page max
      e.preventDefault();
      const ph = pageHeight();
      const clampedDy = Math.max(-ph, Math.min(ph, rawDy));
      host.scrollTop = touchStartScroll + clampedDy;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      const ph = pageHeight();
      const hostDelta = host.scrollTop - touchStartScroll;

      // If the host didn't move during the gesture, it was an internal
      // section scroll — don't trigger page navigation.
      if (Math.abs(hostDelta) < EDGE_EPSILON) return;

      if (Math.abs(dy) < TOUCH_THRESHOLD) {
        // partial drag without enough intent — snap back to start page
        animateTo(Math.round(touchStartScroll / ph) * ph);
        return;
      }

      const startPage = Math.round(touchStartScroll / ph);
      const targetPage = startPage + (dy > 0 ? 1 : -1);
      const max = host.scrollHeight - host.clientHeight;
      animateTo(Math.max(0, Math.min(max, targetPage * ph)));
    };

    host.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("touchstart", onTouchStart, { passive: true });
    host.addEventListener("touchmove", onTouchMove, { passive: false });
    host.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      host.removeEventListener("wheel", onWheel);
      host.removeEventListener("touchstart", onTouchStart);
      host.removeEventListener("touchmove", onTouchMove);
      host.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}

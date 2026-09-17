"use client";

import { useEffect, useRef, type PointerEvent } from "react";

export function usePointerGlow() {
  const frame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const element = event.currentTarget;
    const { left, top } = element.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty("--pointer-x", `${x}px`);
      element.style.setProperty("--pointer-y", `${y}px`);
      frame.current = null;
    });
  };
}

import { useEffect, useRef } from "react";

export function shouldSkipHotkeyTarget(
  target,
  { allowRangeInput = true } = {},
) {
  if (!target) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName?.toLowerCase();
  if (tag === "textarea" || tag === "select") return true;
  if (tag !== "input") return false;

  const type = (target.type || "").toLowerCase();
  if (allowRangeInput && type === "range") return false;
  return true;
}

export function useStableHotkeys(handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event) => {
      handlerRef.current?.(event);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}


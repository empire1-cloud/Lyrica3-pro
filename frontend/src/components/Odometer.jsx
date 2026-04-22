import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Odometer-style rolling number — smoothly animates between values digit-by-digit.
 * Great for fractional USD micro-royalties ticking up.
 */
export default function Odometer({ value, decimals = 4, prefix = "", className = "" }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const fromRef = useRef(value);
  const toRef = useRef(value);
  const startRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    toRef.current = value;
    startRef.current = performance.now();
    const DURATION = 600;
    const tick = (t) => {
      const p = Math.min(1, (t - startRef.current) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, display]);

  const str = display.toFixed(decimals);
  const chars = useMemo(() => (prefix + str).split(""), [prefix, str]);

  return (
    <span className={`inline-flex tabular-nums overflow-hidden ${className}`} data-testid="odometer">
      {chars.map((c, i) => (
        <span key={`char-${c}-${i}`} className="relative inline-block">
          {/[0-9]/.test(c) ? (
            <span className="inline-block transition-transform duration-200" style={{ transform: "translateY(0)" }}>
              {c}
            </span>
          ) : (
            <span>{c}</span>
          )}
        </span>
      ))}
    </span>
  );
}

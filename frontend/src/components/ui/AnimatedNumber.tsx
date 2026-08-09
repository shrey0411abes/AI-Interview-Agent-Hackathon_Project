import React, { useEffect, useState } from 'react';
import { useMotionValue, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.8,
  prefix,
  suffix,
  className = '',
}) => {
  const raw = String(value);

  // Auto-detect: find the FIRST contiguous number in the string, and treat
  // everything before it as an auto-prefix, everything after as an auto-suffix.
  // This preserves "~8 min" -> prefix "~", number 8, suffix " min"
  // and "100%" -> prefix "", number 100, suffix "%"
  const match = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);

  // Ranges like "5–10" contain a SECOND number after the first — if so,
  // don't animate at all, just render the original string statically.
  // (Animating a range as a single merged number is the original bug.)
  const hasSecondNumber = match ? /\d/.test(match[3]) : false;

  const isNumeric = !!match && !hasSecondNumber;
  const numericVal = isNumeric ? parseFloat(match![2]) : NaN;
  const autoPrefix = match ? match[1] : '';
  const autoSuffix = match ? match[3] : '';

  const count = useMotionValue(0);
  const [displayVal, setDisplayVal] = useState<string>(isNumeric ? '0' : raw);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayVal(raw);
      return;
    }

    const controls = animate(count, numericVal, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayVal(Math.round(latest).toString());
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericVal, isNumeric, duration, raw]);

  if (!isNumeric) {
    // Static fallback for ranges or non-numeric strings — never corrupt these
    return <span className={className}>{raw}</span>;
  }

  return (
    <span className={className}>
      {prefix ?? autoPrefix}
      {displayVal}
      {suffix ?? autoSuffix}
    </span>
  );
};

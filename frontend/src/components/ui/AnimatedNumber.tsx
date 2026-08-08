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
  prefix = '',
  suffix = '',
  className = '',
}) => {
  // If non-numeric (e.g. "~8 min" or "100%"), extract number or render static fallback
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = !isNaN(numericVal);

  const count = useMotionValue(0);
  const [displayVal, setDisplayVal] = useState<string>(isNumeric ? '0' : String(value));

  useEffect(() => {
    if (!isNumeric) {
      setDisplayVal(String(value));
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
  }, [numericVal, isNumeric, duration, count, value]);

  if (!isNumeric) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {prefix}
      {displayVal}
      {suffix}
    </span>
  );
};

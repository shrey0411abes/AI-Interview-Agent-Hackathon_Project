import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { EMPTY_LIST_MESSAGES } from '../../lib/feedbackDisplay';

interface FeedbackListCardProps {
  title: string;
  icon: LucideIcon;
  items: string[];
  field: keyof typeof EMPTY_LIST_MESSAGES;
  headerClass: string;
  cardClass: string;
  bulletClass: string;
  animationDelay?: number;
}

export const FeedbackListCard: React.FC<FeedbackListCardProps> = ({
  title,
  icon: Icon,
  items,
  field,
  headerClass,
  cardClass,
  bulletClass,
  animationDelay = 0,
}) => (
  <div className={`glass-card rounded-2xl p-6 ${cardClass}`}>
    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4 ${headerClass}`}>
      <Icon className="w-4 h-4" />
      {title}
    </h3>
    {items.length > 0 ? (
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animationDelay + idx * 0.08 }}
            className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed"
          >
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${bulletClass}`} />
            {item}
          </motion.li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-[var(--text-muted)] italic leading-relaxed">
        {EMPTY_LIST_MESSAGES[field]}
      </p>
    )}
  </div>
);

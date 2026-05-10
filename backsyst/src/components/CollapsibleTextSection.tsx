"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface CollapsibleTextSectionProps {
  title: string;
  content: string;
  defaultExpanded?: boolean;
}

export function CollapsibleTextSection({
  title,
  content,
  defaultExpanded = true,
}: CollapsibleTextSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section className="bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5" style={{ color: '#E8B824' }} />
          <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
            {title}
          </h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" style={{ color: '#6B7280' }} />
        ) : (
          <ChevronDown className="h-5 w-5" style={{ color: '#6B7280' }} />
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div
                className="prose prose-sm max-w-none"
                style={{ color: '#374151', lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview when collapsed */}
      {!isExpanded && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-500 line-clamp-2">
            {content.replace(/<[^>]*>/g, '').substring(0, 100)}...
          </p>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm font-medium mt-2"
            style={{ color: '#E8B824' }}
          >
            Tap untuk baca selengkapnya
          </button>
        </div>
      )}
    </section>
  );
}

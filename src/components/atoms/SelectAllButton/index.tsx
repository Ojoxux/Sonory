'use client'

import { motion } from 'framer-motion'
import type { SelectAllButtonProps } from './type'

export function SelectAllButton({
  allSelected,
  onSelectAll,
  isClosing = false,
}: SelectAllButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={
        isClosing
          ? { opacity: 0, y: 20, scale: 0.8 }
          : {
              opacity: 1,
              y: 0,
              scale: [0.8, 1.05, 1],
            }
      }
      transition={
        isClosing
          ? { duration: 0.2 }
          : {
              delay: 1.8,
              duration: 0.6,
              ease: [0.68, -0.55, 0.265, 1.55],
            }
      }
      className="flex justify-center mb-3 relative z-10"
    >
      <motion.button
        onClick={onSelectAll}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 backdrop-blur-sm border border-neutral-600/50 hover:border-neutral-500/70 transition-all duration-200"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
      >
        <motion.div
          className={`
            w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-300
            ${
              allSelected
                ? 'bg-white border-white shadow-[0_2px_8px_rgba(255,255,255,0.3)]'
                : 'bg-transparent border-neutral-400 hover:border-neutral-300'
            }
          `}
          whileTap={{ scale: 0.8 }}
          animate={
            allSelected
              ? {
                  boxShadow: [
                    '0 2px 8px rgba(255,255,255,0.3)',
                    '0 4px 12px rgba(255,255,255,0.5)',
                    '0 2px 8px rgba(255,255,255,0.3)',
                  ],
                }
              : {}
          }
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {allSelected && (
            <motion.svg
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1.2, 1],
                rotate: [-180, 0],
              }}
              transition={{
                duration: 0.5,
                ease: [0.68, -0.55, 0.265, 1.55],
              }}
              className="w-2.5 h-2.5 text-black"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </motion.div>
        <span className="text-neutral-100 text-sm font-medium">
          {allSelected ? 'すべて解除' : 'すべて選択'}
        </span>
      </motion.button>
    </motion.div>
  )
}
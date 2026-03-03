import { Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FilterButtonProps {
  selectedCount: number
  onClick: () => void
}

export function FilterButton({ selectedCount, onClick }: FilterButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="打开筛选面板"
    >
      <Filter className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full"
          >
            {selectedCount}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface TopSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopSearchBar = ({ isOpen, onClose }: TopSearchBarProps) => {
  const [searchValue, setSearchValue] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('Search:', searchValue);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: -56 }}
          animate={{ y: 0 }}
          exit={{ y: -56 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-zinc-800 z-[100] flex items-center px-5"
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent text-white text-sm outline-none uppercase tracking-widest placeholder-zinc-600"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

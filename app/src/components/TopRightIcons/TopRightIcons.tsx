import { Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopRightIconsProps {
  onSearchClick: () => void;
  onUserClick: () => void;
  searchActive: boolean;
  userActive: boolean;
}

export const TopRightIcons = ({ onSearchClick, onUserClick, searchActive, userActive }: TopRightIconsProps) => {
  return (
    <motion.div 
      className="fixed top-5 right-5 z-50 flex gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <button
        onClick={onSearchClick}
        className={`w-9 h-9 flex items-center justify-center border transition-all duration-150 ${
          searchActive 
            ? 'bg-[#002FA7] border-[#002FA7] text-white' 
            : 'bg-transparent border-white text-white hover:bg-white hover:text-black'
        }`}
      >
        <Search size={16} strokeWidth={1.5} />
      </button>
      <button
        onClick={onUserClick}
        className={`w-9 h-9 flex items-center justify-center border transition-all duration-150 ${
          userActive 
            ? 'bg-[#002FA7] border-[#002FA7] text-white' 
            : 'bg-transparent border-white text-white hover:bg-white hover:text-black'
        }`}
      >
        <User size={16} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Grid3x3, MousePointer2 } from 'lucide-react';

interface GalleryModeToggleProps {
  mode: 'distortion' | 'mouseFollow';
  onToggle: () => void;
}

export const GalleryModeToggle = ({ mode, onToggle }: GalleryModeToggleProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onToggle}
      className="fixed bottom-5 left-5 z-[60] group relative overflow-hidden border border-white bg-white text-black hover:bg-[#002FA7] hover:text-white hover:border-[#002FA7] transition-all duration-150"
      style={{ width: '36px', height: '36px' }}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {mode === 'distortion' ? (
          <MousePointer2 size={16} strokeWidth={1.5} />
        ) : (
          <Grid3x3 size={16} strokeWidth={1.5} />
        )}
      </motion.div>
    </motion.button>
  );
};

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mainCategories = ['new', 'pants', 'shirts', 'layers', 'objects'];
const subCategories = ['all', 'injex', 'fcloth', 'ramie', 'supermarine'];

export const FilterControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMain, setActiveMain] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const handleMainSelect = (cat: string) => {
    setActiveMain(cat);
    setActiveSub(null);
  };

  const handleSubSelect = (sub: string) => {
    setActiveSub(sub);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-2 flex flex-col items-end gap-0.5"
          >
            {/* Main Categories - Vertical */}
            {mainCategories.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => handleMainSelect(cat)}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`text-[10px] font-semibold uppercase tracking-wider px-3 h-7 border transition-all ${
                  activeMain === cat
                    ? 'bg-[#002FA7] text-white border-[#002FA7]'
                    : 'bg-white text-black border-white hover:bg-zinc-100'
                }`}
              >
                {cat}
              </motion.button>
            ))}

            {/* Sub Categories - Vertical */}
            <AnimatePresence>
              {activeMain && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 bg-zinc-900 border border-zinc-800 flex flex-col"
                >
                  {subCategories.map((sub) => (
                    <motion.button
                      key={sub}
                      onClick={() => handleSubSelect(sub)}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={`text-left text-[10px] font-medium uppercase tracking-wider px-3 h-7 border-b border-zinc-800 last:border-b-0 transition-all ${
                        activeSub === sub
                          ? 'bg-[#002FA7] text-white'
                          : 'bg-transparent text-white hover:bg-zinc-800'
                      }`}
                    >
                      {sub}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Toggle Button - Square */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`flex items-center justify-center border transition-all ${
          isOpen
            ? 'bg-[#002FA7] text-white border-[#002FA7]'
            : 'bg-white text-black border-white hover:bg-zinc-100'
        }`}
        style={{ width: '36px', height: '36px' }}
      >
        <ChevronDown
          size={14}
          strokeWidth={2}
          className="transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </motion.button>
    </div>
  );
};

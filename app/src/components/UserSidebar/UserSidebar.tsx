import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const favorites = [
  { id: 1, name: 'Injex Garage Jacket', price: '$395' },
  { id: 2, name: 'Slim Dungarees', price: '$198' },
  { id: 3, name: 'F.Cloth Hard Shirt', price: '$225' }
];

export const UserSidebar = ({ isOpen, onClose }: UserSidebarProps) => {
  const [showFavorites, setShowFavorites] = useState(false);
  const [favList, setFavList] = useState(favorites);

  const removeFavorite = (id: number) => {
    setFavList(favList.filter(f => f.id !== id));
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[90]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed top-0 right-0 w-[280px] h-screen bg-black border-l border-zinc-800 z-[100] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 p-4 flex justify-between items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest">Account</span>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-zinc-800 flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Avatar */}
        <div className="p-5 border-b border-zinc-800">
          <div className="w-12 h-12 overflow-hidden relative group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face"
              alt="User"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#002FA7]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] uppercase tracking-wider">Edit</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold uppercase tracking-wider">Alex Chen</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">alex@outlier.nyc</div>
          </div>
        </div>

        {/* Nav Items */}
        <div>
          <button className="w-full px-5 py-4 border-b border-zinc-900 text-left text-[11px] font-medium uppercase tracking-wider flex justify-between items-center hover:bg-zinc-950 transition-colors">
            <span>Orders</span>
            <ChevronRight size={10} className="text-zinc-600" />
          </button>

          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="w-full px-5 py-4 border-b border-zinc-900 text-left text-[11px] font-medium uppercase tracking-wider flex justify-between items-center hover:bg-zinc-950 transition-colors"
          >
            <span>Favorites</span>
            <span className="bg-white text-black text-[9px] px-1.5 py-0.5 font-semibold">{favList.length}</span>
          </button>

          {/* Favorites Submenu */}
          <AnimatePresence>
            {showFavorites && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-zinc-950 border-b border-zinc-900 overflow-hidden"
              >
                {favList.map((item) => (
                  <div key={item.id} className="px-5 py-3 flex justify-between items-center border-b border-zinc-900 last:border-b-0">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider">{item.name}</div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">{item.price}</div>
                    </div>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="text-zinc-700 hover:text-red-500 text-xs px-1 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button className="w-full px-5 py-4 border-b border-zinc-900 text-left text-[11px] font-medium uppercase tracking-wider flex justify-between items-center hover:bg-zinc-950 transition-colors">
            <span>Addresses</span>
            <ChevronRight size={10} className="text-zinc-600" />
          </button>
        </div>

        {/* Sign Out */}
        <div className="p-5 mt-auto">
          <button className="w-full border border-zinc-700 py-2.5 text-[10px] font-semibold uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all">
            Sign Out
          </button>
        </div>
      </motion.div>
    </>
  );
};

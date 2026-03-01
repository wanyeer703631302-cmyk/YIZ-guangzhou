import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DistortionGallery } from './components/DistortionGallery';
import { MouseFollowGallery } from './components/MouseFollowGallery/MouseFollowGallery';
import { GalleryModeToggle } from './components/GalleryModeToggle/GalleryModeToggle';
import { TopRightIcons } from './components/TopRightIcons/TopRightIcons';
import { TopSearchBar } from './components/TopSearchBar/TopSearchBar';
import { FilterControl } from './components/FilterControl/FilterControl';
import { UserSidebar } from './components/UserSidebar/UserSidebar';
import { MaintenanceMode } from './components/MaintenanceMode/MaintenanceMode';
import { useAssets } from './hooks/useAssets';
import { useHealthCheck } from './hooks/useHealthCheck';
import type { GalleryItem } from './types/gallery';

// 保留硬编码数据作为后备
const fallbackGalleryData: GalleryItem[] = [
  { id: 1, title: "Pixel Singapore Takeover", brand: "Google", category: ["PRODUCT", "CAMPAIGN", "CONTENT"], year: "2025", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", color: "from-blue-500/20 to-purple-500/20" },
  { id: 2, title: "Festive Greetings", brand: "Johnnie Walker", category: ["COMMUNICATION", "ILLUSTRATION", "CAMPAIGN"], year: "2025", image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&h=600&fit=crop", color: "from-amber-500/20 to-orange-500/20" },
  { id: 3, title: "Cloud Discovery", brand: "Google Cloud", category: ["EXPERIENCE", "PHYSICAL", "EVENT"], year: "2025", image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop", color: "from-cyan-500/20 to-blue-500/20" },
  { id: 4, title: "Business Resilience", brand: "Zendesk", category: ["COMMUNICATION", "AI", "EVENT"], year: "2023", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop", color: "from-green-500/20 to-emerald-500/20" },
  { id: 5, title: "Club Vibe", brand: "Baja Cat", category: ["EXPERIENCE", "WEBSITE", "3D"], year: "2025", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", color: "from-pink-500/20 to-rose-500/20" },
  { id: 6, title: "AI Compass", brand: "Google", category: ["EXPERIENCE", "WEBSITE", "CONTENT"], year: "2024", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop", color: "from-violet-500/20 to-purple-500/20" },
  { id: 7, title: "Visitor Experience", brand: "Google", category: ["EXPERIENCE", "PHYSICAL", "EVENT"], year: "2026", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop", color: "from-teal-500/20 to-cyan-500/20" },
  { id: 8, title: "Season's Treatings", brand: "Nando's", category: ["EXPERIENCE", "3D", "AI"], year: "2026", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop", color: "from-red-500/20 to-orange-500/20" },
  { id: 9, title: "Virtual Try-On", brand: "Netflix", category: ["EXPERIENCE", "WEBSITE", "CAMPAIGN"], year: "2024", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=600&fit=crop", color: "from-red-600/20 to-red-400/20" },
  { id: 10, title: "Walking Tour", brand: "Stranger Things", category: ["EXPERIENCE", "PHYSICAL", "EVENT"], year: "2023", image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=600&fit=crop", color: "from-indigo-500/20 to-blue-500/20" },
  { id: 11, title: "Extra Hot", brand: "Nando's", category: ["EXPERIENCE", "WEBSITE", "CAMPAIGN"], year: "2023", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop", color: "from-yellow-500/20 to-orange-500/20" },
  { id: 12, title: "Doodle Champion", brand: "Google", category: ["PRODUCT", "GAME", "BRAND"], year: "2021", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop", color: "from-green-400/20 to-teal-500/20" }
];

function App() {
  const [selectedUser, setSelectedUser] = useState(0);
  const [galleryMode, setGalleryMode] = useState<'distortion' | 'mouseFollow'>('distortion');
  const [searchOpen, setSearchOpen] = useState(false);
  const [userSidebarOpen, setUserSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 健康检查
  const { isChecking: isCheckingHealth, isHealthy, error: healthError, data: healthData, retry: retryHealth } = useHealthCheck();

  // 从API加载资源
  const { items: apiItems, isLoading, error, refetch } = useAssets();
  
  // 使用API数据，如果为空或出错则使用后备数据
  const galleryData = apiItems.length > 0 ? apiItems : fallbackGalleryData;

  const users = [
    { id: 1, name: '@phantom_studio' },
    { id: 2, name: '@creative_labs' },
    { id: 3, name: '@design_collective' }
  ];

  // 如果正在检查健康状态，显示加载界面
  if (isCheckingHealth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white/60">正在连接后端服务...</p>
        </div>
      </div>
    );
  }

  // 如果后端不健康，显示维护模式
  if (!isHealthy) {
    return <MaintenanceMode error={healthError} healthData={healthData} onRetry={retryHealth} />;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="fixed inset-0 grid-lines pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <header className="fixed top-0 left-0 z-50 px-6 py-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <img src="/YIZ_LOGO.svg" alt="YIZ" className="h-9 w-auto" />
        </motion.div>
      </header>

      <TopRightIcons onSearchClick={() => setSearchOpen(!searchOpen)} onUserClick={() => setUserSidebarOpen(!userSidebarOpen)} searchActive={searchOpen} userActive={userSidebarOpen} />
      <TopSearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <UserSidebar isOpen={userSidebarOpen} onClose={() => setUserSidebarOpen(false)} />

      <main className="relative z-10">
        <section className="h-screen" id="work">
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                <p className="text-white/60">加载资源中...</p>
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {!isLoading && error && apiItems.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-white mb-2">加载失败</h2>
                <p className="text-white/60 mb-6">{error}</p>
                <button
                  onClick={refetch}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && !error && apiItems.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-2xl font-bold text-white mb-2">暂无内容</h2>
                <p className="text-white/60">还没有上传任何作品，快来上传第一个作品吧！</p>
              </div>
            </div>
          )}

          {/* 画廊内容 */}
          {!isLoading && galleryData.length > 0 && (
            <motion.div key={galleryMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full">
              {galleryMode === 'distortion' ? (
                <DistortionGallery items={galleryData} />
              ) : (
                <MouseFollowGallery items={galleryData} />
              )}
            </motion.div>
          )}
        </section>
      </main>

      <GalleryModeToggle mode={galleryMode} onToggle={() => setGalleryMode(prev => prev === 'distortion' ? 'mouseFollow' : 'distortion')} />
      <FilterControl />

      <motion.div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
        {users.map((user, index) => (
          <motion.button key={user.id} onClick={() => setSelectedUser(index)} whileHover={{ scale: 1.2, y: -8 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className={`text-sm font-medium transition-colors ${selectedUser === index ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
            {user.name}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

export default App;

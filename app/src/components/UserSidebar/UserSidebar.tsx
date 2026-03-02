import { useState } from 'react';
import { X, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSidebar = ({ isOpen, onClose }: UserSidebarProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleAuthSuccess = () => {
    // 登录/注册成功后关闭侧边栏
    setTimeout(() => {
      onClose();
    }, 500);
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
        className="fixed top-0 right-0 w-[400px] h-screen bg-black border-l border-zinc-800 z-[100] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 p-4 flex justify-between items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest">
            {isAuthenticated ? '账户' : '登录 / 注册'}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-zinc-800 flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* 已登录状态 */}
        {isAuthenticated && user && (
          <div className="p-6">
            {/* 用户信息 */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <UserIcon size={32} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">{user.name}</div>
                <div className="text-sm text-zinc-500">{user.email}</div>
              </div>
            </div>

            {/* 登出按钮 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 border border-zinc-700 py-3 text-sm font-medium hover:bg-white hover:text-black hover:border-white transition-all"
            >
              <LogOut size={16} />
              登出
            </button>
          </div>
        )}

        {/* 未登录状态 - 显示登录/注册表单 */}
        {!isAuthenticated && (
          <div className="p-6">
            {authView === 'login' ? (
              <LoginForm
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setAuthView('register')}
              />
            ) : (
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setAuthView('login')}
              />
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};

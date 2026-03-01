import React from 'react';

export interface LoadingStateProps {
  progress?: number;
}

/**
 * 加载状态组件
 * 显示加载进度和动画
 */
export const LoadingState = React.memo<LoadingStateProps>(({ progress }) => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-black"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="text-center">
        <div className="text-white text-sm mb-2">
          Loading gallery...
        </div>
        {progress !== undefined && (
          <div className="text-white/60 text-xs">
            {progress}%
          </div>
        )}
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

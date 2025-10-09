import React, { useState } from 'react';
import { cx } from '../../utils/cx';

interface FloatingButtonProps {
  /** 按钮图标 */
  icon: React.ReactNode;
  /** 激活状态时的图标 */
  activeIcon: React.ReactNode;
  /** 点击事件处理函数 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  activeIcon,
  onClick,
  className,
}) => {
  const [isActive, setIsActive] = useState(false);

  // 根据状态选择样式 - 固定使用primary样式
  const getButtonStyles = () => {
    if (isActive) {
      return 'bg-gray-300 text-gray-900 shadow-xl';
    }
    
    return 'bg-white text-gray-700 shadow-lg';
  };

  const handleClick = () => {
    setIsActive(!isActive);
    onClick?.();
  };

  return (
    <button
      className={cx(
        // 基础样式
        'fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center',
        'transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'active:scale-95',
        // 状态样式
        getButtonStyles(),
        // 自定义类名
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      aria-label={isActive ? '关闭' : '打开'}
    >
      <div className="flex items-center justify-center transition-all duration-300 ease-in-out">
        {isActive ? activeIcon : icon}
      </div>
    </button>
  );
};

export default FloatingButton;

import { useEffect, useState } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 获取系统偏好主题
    const getSystemTheme = (): 'light' | 'dark' => {
      const initialDarkMode =
      !!document.querySelector('meta[name="color-scheme"][content="dark"]') ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
      return initialDarkMode ? 'dark' : 'light';
    };

    // 初始化主题
    const initialTheme = getSystemTheme();
    setTheme(initialTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    // 清理函数
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    // 设置 data-theme 属性到 document.documentElement
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setTheme(theme);
    
    // 控制 body 上的 darkmode 类
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  return { theme, setTheme: applyTheme };
};

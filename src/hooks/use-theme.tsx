import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext<{
  theme: 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => void;
} | null>(null);

export const LoadingPage = ({ label }: { label: string }) => {
  return (
    <div className="flex justify-center items-center h-screen"
      style={{
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--background-color-primary)',
      }}
    >
      <LoadingIndicator type="line-spinner" size="md" label={label} />
    </div>
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 获取系统偏好主题
    const getSystemTheme = (): 'light' | 'dark' => {
      // 用户设置的偏好主题
      const preferThemeLocalStorage = localStorage.getItem('theme');
      if (preferThemeLocalStorage) {
        return preferThemeLocalStorage as 'light' | 'dark';
      }

      // 系统偏好主题
      const initialDarkMode =
        !!document.querySelector('meta[name="color-scheme"][content="dark"]') ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      return initialDarkMode ? 'dark' : 'light';
    };

    // 初始化主题
    const initialTheme = getSystemTheme();
    applyTheme(initialTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')

    mediaQuery.addEventListener('change', handleChange);
    // 清理函数
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setTheme(theme);
    // 控制 body 上的 darkmode 类
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
    {children}
  </ThemeContext.Provider>;
}


export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
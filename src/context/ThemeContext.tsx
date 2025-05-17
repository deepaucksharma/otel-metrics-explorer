import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useStore } from '../services/stateStore';

// Theme context type
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDarkMode = useStore((state) => state.uiState.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  
  // Apply theme to document when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

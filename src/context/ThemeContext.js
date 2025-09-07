import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { getThemeColors } from '../theme/colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme());
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  // Escuchar cambios en el tema del sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Determinar si usar modo oscuro
  useEffect(() => {
    let shouldUseDark = false;
    
    switch (themeMode) {
      case 'dark':
        shouldUseDark = true;
        break;
      case 'light':
        shouldUseDark = false;
        break;
      case 'system':
      default:
        shouldUseDark = systemTheme === 'dark';
        break;
    }
    
    setIsDarkMode(shouldUseDark);
  }, [themeMode, systemTheme]);

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (mode) => {
    if (['light', 'dark', 'system'].includes(mode)) {
      setThemeMode(mode);
    }
  };

  const colors = getThemeColors(isDarkMode);

  const theme = {
    isDarkMode,
    themeMode,
    colors,
    toggleTheme,
    setTheme,
    
    // Estilos comunes basados en el tema
    styles: {
      container: {
        backgroundColor: colors.background,
      },
      surface: {
        backgroundColor: colors.surface,
      },
      text: {
        color: colors.text,
      },
      textSecondary: {
        color: colors.textSecondary,
      },
      textTertiary: {
        color: colors.textTertiary,
      },
      border: {
        borderColor: colors.border,
      },
      shadow: {
        shadowColor: colors.shadow,
        elevation: isDarkMode ? 8 : 3,
        shadowOffset: { width: 0, height: isDarkMode ? 4 : 2 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: isDarkMode ? 8 : 4,
      },
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
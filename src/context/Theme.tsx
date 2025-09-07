import { PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { DEFAULT_THEME, SUPPORTED_THEMES, Theme, ThemeClassName, useTheme } from '../hooks';

const ThemeContext = createContext<{
  theme: Theme;
  themeClassName: ThemeClassName;
  toggleTheme: () => void;
}>({
  theme: DEFAULT_THEME,
  themeClassName: SUPPORTED_THEMES[DEFAULT_THEME],
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider = ({
  targetOrigin,
  children,
}: PropsWithChildren<{ targetOrigin: string }>) => {
  const { theme, toggleTheme } = useTheme(targetOrigin);

  const value = useMemo(
    () => ({
      theme,
      themeClassName: SUPPORTED_THEMES[theme],
      toggleTheme,
    }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

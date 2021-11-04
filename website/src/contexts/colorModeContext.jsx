import React, { useState, useContext, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getCustomTheme } from '../theme';

const ColorModeContext = React.createContext();
export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = (props) => {
  const [colorMode, setColorMode] = useState(
    localStorage.getItem('usa-is-theme-dark') || 'light'
  );

  useEffect(() => {
    localStorage.setItem('usa-is-theme-dark', colorMode);
    document.body.classList.remove(colorMode === 'light' ? 'dark' : 'light');
    document.body.classList.add(colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  };

  const theme = useMemo(
    () => createTheme(getCustomTheme(colorMode)),
    [colorMode]
  );

  return (
    <ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
      <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ColorModeContext;

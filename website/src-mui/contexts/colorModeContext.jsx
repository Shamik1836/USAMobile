import React, { useState, useContext, useMemo } from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GradientProvider } from "./gradientsContext";


const ColorModeContext = React.createContext();
export const useColorMode = () => useContext(ColorModeContext);

const initialState = () => {
  const themeMode = localStorage.getItem('usa-is-theme-dark');
  if (typeof themeMode !== 'undefined' && themeMode !== null)
  	return themeMode;
  return 'light';
}

export const ColorModeProvider = (props) => {
	const [colorMode, setColorMode] = useState(initialState());

	const toggleColorMode = () => {
		localStorage.setItem('usa-is-theme-dark', (colorMode === 'light' ? 'dark' : 'light'));
		setColorMode((prevColorMode) => (prevColorMode === 'light' ? 'dark' : 'light'));
	};
	const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode:colorMode
        }
      }),
    [colorMode]
  );


	return (
		<ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
			<ThemeProvider theme={theme}>
        <GradientProvider>
				{props.children}
        </GradientProvider>
			</ThemeProvider>
		</ColorModeContext.Provider>
	);
};

export default ColorModeContext;

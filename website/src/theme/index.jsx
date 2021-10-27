const uwDarkText = '#1A202C';
const uwLightText = '#ffffffeb';

export const getCustomTheme = (colorMode = 'light') => ({
  palette: {
    mode: colorMode,
    uwprimary: {
      contrastText: "#FFFFFF",
      main: uwDarkText,
      dark: "#000000",
      light: "#414755"
    },
    text: {
      ...(colorMode === 'light'
        ? { primary: uwDarkText }
        : { primary: uwLightText })
    }
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'uw' },

          style: {
            background: 'transparent',
            lineHeight: 2,
            ...(colorMode === 'light'
              ? {
                border: '1px solid #E2E8F0',
                color: uwDarkText
              }
              : {
                borderWidth: 0,
                color: uwLightText
              })
          },
        }
      ]
    },
    MuiIconButton: {
      variants: [
        {
          props: { variant: 'uw' },
          style: {
            background: 'transparent',
            width:'2.5rem',
            height: '2.5rem',
            alignSelf: 'center',
            border: '1px solid #E2E8F0',
            borderRadius: '.3rem',
            ...(colorMode === 'light'
              ? {
                color: uwDarkText
              }
              : {
                color: uwLightText
              })
          },
        }
      ]
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          // Some CSS
          padding: '8px 16px',
        },
      },
    }
  },

});
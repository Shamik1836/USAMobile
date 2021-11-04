import { IconButton, Tooltip } from '@mui/material';

import { useColorMode } from '../../../contexts/colorModeContext';

import './styles.css';

export const UWIconButton = ({
  toolTipTitle,
  label,
  onClick,
  lightIcon,
  className = '',
  ...props
}) => {
  const { colorMode } = useColorMode();

  return (
    <Tooltip title={toolTipTitle}>
      <IconButton
        aria-label={label}
        className={`uw-icon-button ${className}`}
        sx={{
          width: 'auto',
          height: '2.5rem',
          alignSelf: 'center',
          borderColor: '#e2e8f0 !important',
          border: 1,
          borderRadius: '.3rem',
          boxShadow: 'var(--boxShadow)',
        }}
        variant={colorMode === 'light' ? 'outlined' : 'contained'}
        onClick={onClick}
      >
        {props.children}
      </IconButton>
    </Tooltip>
  );
};

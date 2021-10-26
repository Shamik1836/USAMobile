import { IconButton, Tooltip } from '@mui/material';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import Brightness5Icon from '@mui/icons-material/Brightness5';

import { useColorMode } from '../../../contexts/colorModeContext';
import { useGradient } from "../../../contexts/gradientsContext";


import "./styles.css";

export const UWIconButton = ({ toolTipTitle, label, onClick, lightIcon, className = '', ...props }) => {
	const { darkBoxShadow } = useGradient();
	const { colorMode } = useColorMode()


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
					alignSelf: 'center',
					boxShadow: darkBoxShadow
				}}
				variant={colorMode === "light" ? "outlined" : "contained"}
				onClick={onClick}>
				{props.children}
			</IconButton>
		</Tooltip>

	);
};

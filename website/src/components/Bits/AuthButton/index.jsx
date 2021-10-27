import React, { useState } from "react";
import { useMoralis } from "react-moralis";
import { Button, Drawer, IconButton, Tooltip } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { AuthDrawer } from '../AuthDrawer';
import { DrawerHeader } from '../DrawerHeader';
import { useGradient } from "../../../contexts/gradientsContext";


import "./styles.css";


export const AuthButton = () => {
	const { isAuthenticated, logout } = useMoralis();
	const [ isOpen, setIsOpen ] = useState(false);

	const { darkBoxShadow } = useGradient();

	const toggleDrawer = (open) => {
		setIsOpen(open);
	}
	const onCloseDrawer = () => {
		console.log('OnClose Drawer.');
	}

	return (
		<>
			{isAuthenticated ? (
				<Tooltip title="Log out of USA Wallet.">
					<IconButton
						aria-label="Log Out"
						className="LogoutButton"
						sx={{boxShadow: darkBoxShadow }} 
						variant="uw"
						onClick={() => logout()}
					>
						<LockOpenIcon className="nav-bar-icon" />
					</IconButton>
				</Tooltip>
			) : (
				<>
					<Tooltip title="Log into USA Wallet.">
						<IconButton
							aria-label="Log In"
							className="LoginButton"
							sx={{boxShadow: darkBoxShadow }} 
							variant="uw"
							onClick={() => toggleDrawer(true)}
						>
							<LockIcon className="nav-bar-icon" />
						</IconButton>
					</Tooltip>
					<Drawer open={isOpen} anchor="right" onClose={onCloseDrawer}>
						<DrawerHeader closeDrawer={()=>toggleDrawer(false)}>
							Please sign in.
						</DrawerHeader>
						<AuthDrawer closeDrawer={onCloseDrawer} />
						<Tooltip title="Cancel identity action.">
							<Button variant="outline" sx={{ mr: 3 }} onClick={() => toggleDrawer(false)}>
								Cancel
							</Button>
						</Tooltip>
					</Drawer>
				</>
			)}
		</>
	);
};

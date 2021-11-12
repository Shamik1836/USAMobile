import React, { useState } from 'react';
import { useMoralis } from 'react-moralis';
import { Button, Drawer, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { AuthDrawer } from '../AuthDrawer';
import { DrawerHeader } from '../DrawerHeader';

import './styles.css';

export const AuthButton = () => {
  const { isAuthenticated, logout } = useMoralis();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open) => {
    setIsOpen(open);
  };
  const onCloseDrawer = () => {
    console.log('OnClose Drawer.');
  };

  return (
    <>
      {isAuthenticated ? (
        <Tooltip title="Log out of USA Wallet.">
          <Button
            variant="uw"
            sx={{
              alignSelf: 'center',
              border: 1,
              boxShadow: 'var(--boxShadow)',
              borderColor: 'var(--borderColor)',
              color: 'var(--color)',
              height: 40,
            }}
            aria-label="Log Out"
            className="LogoutButton"
            startIcon={<LockOpenIcon className="nav-bar-icon" />}
            onClick={() => logout()}
          >
            Log Out
          </Button>
        </Tooltip>
      ) : (
        <>
          <Tooltip title="Log into USA Wallet.">
            <Button
              variant="uw"
              sx={{
                alignSelf: 'center',
                border: 1,
                boxShadow: 'var(--boxShadow)',
                borderColor: 'var(--borderColor)',
                color: 'var(--color)',
                height: 40,
              }}
              aria-label="Log In"
              className="LoginButton"
              startIcon={<LockIcon className="nav-bar-icon" />}
              onClick={() => toggleDrawer(true)}
            >
              Log In
            </Button>
          </Tooltip>
          <Drawer open={isOpen} anchor="right" onClose={onCloseDrawer}>
            <DrawerHeader closeDrawer={() => toggleDrawer(false)}>
              Please sign in.
            </DrawerHeader>
            <AuthDrawer closeDrawer={onCloseDrawer} />
            <Tooltip title="Cancel identity action.">
              <Button
                variant="outline"
                sx={{ mr: 3 }}
                onClick={() => toggleDrawer(false)}
              >
                Cancel
              </Button>
            </Tooltip>
          </Drawer>
        </>
      )}
    </>
  );
};

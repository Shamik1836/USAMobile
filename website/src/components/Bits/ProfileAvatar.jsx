import React, { useState } from 'react';
import { useMoralis } from 'react-moralis';
import { Avatar, Button, Drawer, Tooltip } from '@mui/material';

import PersonIcon from '@mui/icons-material/Person';

import { AuthDrawer } from './AuthDrawer';
import { DrawerHeader } from './DrawerHeader';

export const ProfileAvatar = () => {
  const { isAuthenticated } = useMoralis();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open) => {
    setIsOpen(open);
  };
  const onCloseDrawer = () => {
    console.log('OnClose Drawer.');
  };

  return (
    <>
      <Tooltip title="Click to update your USA Wallet profile.">
        <Avatar
          sx={{ alignSelf: 'center', color: 'white' }}
          onClick={() => toggleDrawer(true)}
        >
          <PersonIcon />
        </Avatar>
      </Tooltip>
      <Drawer open={isOpen} anchor="right" onClose={onCloseDrawer}>
        <DrawerHeader closeDrawer={() => toggleDrawer(false)}>
          {isAuthenticated ? 'Update user profile.' : 'Please sign in.'}
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
  );
};

import { useState } from 'react';
import { useMoralis } from 'react-moralis';
import { Alert, Button, Stack, TextField, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import './styles.css';

export const AuthDrawer = (props) => {
  const {
    authenticate,
    isAuthenticating,
    authError,
    isAuthenticated,
    login,
    setUserData,
    signup,
    user,
  } = useMoralis();

  const [userName, setUserName] = useState(
    user ? user.attributes.username : ''
  );
  const [email, setEmail] = useState(user ? user.attributes.email : '');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    signup(userName ? userName : email, password, email, { usePost: true });
  };

  const handleLogIn = () => {
    login(email, password === '' ? undefined : password, {
      usePost: true,
    });
  };

  const handleAuthenticate = () => {
    authenticate({ usePost: true });
  };

  const handleSave = () => {
    setUserData({
      userName,
      email,
      password: password === '' ? undefined : password,
      usePost: true,
    });
  };

  const handlePasswordReset = () => {
    console.groupCollapsed('handlePasswordReset');
    if (email === '') {
      alert("Please enter an e-mail, then retry 'Password reset'.");
    } else {
      // const appId = "CkGKKjw1WWWWNAo2GRMO1yPyjTrRx8YAIX4E8Q8q";
      // const serverUrl = "https://jlodflimpqon.moralis.io:2053/server";
      // Moralis.initialize(appId); // Application id from moralis.io
      // Moralis.serverURL = serverUrl; //Server url from moralis.io

      // Moralis.User
      //   .requestPasswordReset(email)
      //   .then(() => {
      //     // Password reset request was sent successfully
      alert('Password reset e-mail has been sent to ' + email);
      //     })
      //     .catch((error) => {
      //       // Show the error message somewhere
      //       alert("Error: " + error.code + " " + error.message);
      //     });
      // }
    }
    console.groupEnd();
  };

  // const emailClassName = () => {
  //   if (isAuthenticated && !isAuthenticating) {
  //     if (user && user.attributes.emailVerified) {
  //       return "email verified";
  //     }
  //   }
  //   return "email unverified";
  // };

  console.groupEnd();

  return (
    <Stack
      spacing={4}
      sx={{
        borderWidth: 5,
        borderRadius: '.375rem',
        p: 2,
        my: 2,
        mx: 5,
        boxShadow: 'var(--boxShadow)',
      }}
    >
      {authError != null && (
        <Alert severity="warning">{authError.message}</Alert>
      )}
      {isAuthenticated && (
        <Tooltip title="Enter desired USA Wallet user name.">
          <TextField
            label="User Name *"
            type="text"
            variant="outlined"
            value={userName}
            onChange={(event) => setUserName(event.currentTarget.value)}
            sx={{ boxShadow: 'var(--boxShadow)' }}
          />
        </Tooltip>
      )}
      <Tooltip title="Enter email where you wish to recieve notifications.">
        <TextField
          className={isAuthenticated ? 'email verified' : 'email'}
          label="E-mail *"
          type="email"
          variant="outlined"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          sx={{ boxShadow: 'var(--boxShadow)' }}
        />
      </Tooltip>
      {user && user.attributes.emailVerified && (
        <Alert severity="warning">Check your email for validation link.</Alert>
      )}
      <Tooltip title="Enter a password.">
        <TextField
          label="Password *"
          type="password"
          variant="outlined"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          sx={{ boxShadow: 'var(--boxShadow)' }}
        />
      </Tooltip>

      {!isAuthenticated ? (
        <>
          <Stack direction="row">
            <Tooltip title="Use the entered e-mail and password to create a new USA Wallet account.">
              <Button variant="outlined" onClick={handleSignUp} sx={{ mr: 2 }}>
                Sign up
              </Button>
            </Tooltip>
            <Tooltip title="Log into USA Wallet with your e-mail and password.">
              <Button variant="outlined" onClick={handleLogIn}>
                Log in
              </Button>
            </Tooltip>
          </Stack>
          <Tooltip title="Send password reset e-mail (coming soon).">
            <span>
              <Button
                variant="outlined"
                onClick={handlePasswordReset}
                disabled
                sx={{ boxShadow: 'var(--boxShadow)' }}
              >
                Password Reset
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Use Metamask to authenticate into your USA Wallet account.">
            <LoadingButton
              variant="outlined"
              loading={isAuthenticating}
              onClick={handleAuthenticate}
              sx={{ boxShadow: 'var(--boxShadow)' }}
            >
              Use MetaMask
            </LoadingButton>
          </Tooltip>
        </>
      ) : (
        <Tooltip title="Update your USA Wallet account to the currently entered user name, e-mail, and password.">
          <Button
            variant="outlined"
            onClick={handleSave}
            sx={{ boxShadow: 'var(--boxShadow)' }}
          >
            Update signature.
          </Button>
        </Tooltip>
      )}
    </Stack>
  );
};

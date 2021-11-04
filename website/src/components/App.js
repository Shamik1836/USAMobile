import React, { useEffect } from "react";
import { useMoralis } from "react-moralis";
import { BrowserRouter, Link, Switch, Route, Redirect } from "react-router-dom";

import { Box, Button, Stack, CircularProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LoopIcon from '@mui/icons-material/Loop';
import LinkIcon from '@mui/icons-material/Link';
import MailIcon from '@mui/icons-material/Mail';

import MetaMaskOnboarding from "@metamask/onboarding";

import { TopNavBar } from './Screens/TopNavBar';
import { ExpertStage } from "./Screens/ExpertStage";
import { PortfolioPrices } from "./Screens/PortfolioPrices";
import { SwapTrade } from "./Screens/SwapTrade";
import { BuySell } from "./Screens/BuySell";
import { SendReceive } from "./Screens/SendReceive";
import { BottomFooter } from "./Screens/BottomFooter";
import { usePositions } from "../hooks/usePositions";

import { useNetwork } from '../contexts/networkContext';

import "./App.scss";

const CryptoRoute = ({ component: Component, address, ...rest }) => {
  return (
    <Route
      {...rest}
      render={() => (address ? <Component /> : <Redirect to="/BuySell" />)}
    />
  );
};

function App() {

  const { isAuthenticated, Moralis, enableWeb3, isWeb3Enabled } = useMoralis();
  const { user, setUserData, isUserUpdating } = useMoralis();

  const { positions, isLoading } = usePositions();
  const { setAccounts, setNetworkId } = useNetwork();
  const address = user?.attributes?.ethAddress;

  useEffect(() => {
    if (isAuthenticated) {
      if (!isWeb3Enabled) {
        enableWeb3();
      }
      if (isWeb3Enabled) {
        if (MetaMaskOnboarding.isMetaMaskInstalled()) {
          if (window?.ethereum?.selectedAddress) {
            setAccounts([window.ethereum?.selectedAddress]);
          }
        }
      }
    }

  }, [isAuthenticated, isWeb3Enabled, enableWeb3, setAccounts]);

  useEffect(() => {
    const initMoralisEvents = () => {
      Moralis.onAccountsChanged((accounts) => {
        setAccounts(accounts);
        if(isAuthenticated){
          if (!isUserUpdating){
            setUserData({
              accounts: accounts,
              ethAddress: accounts?.length > 0 ? accounts[0] : null
            })
          }
        } 
      });
      Moralis.onChainChanged((chainId) => {
        setNetworkId(parseInt(chainId));
      });
    }
    initMoralisEvents();
  }, [Moralis, isAuthenticated, setUserData, setNetworkId, setAccounts]);

  const isOnlyMatic = positions.length === 1 && positions[0].symbol === 'MATIC';

  if (isLoading) {
    return (
      <CircularProgress
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  }

  return (
    <Box>
      <Stack>
        <TopNavBar />
        <ExpertStage />
        {isAuthenticated ? (
          <BrowserRouter>
            <Stack direction="row" sx={{ alignSelf: 'center', justifyContent: 'center', mb: 2 }} spacing={1}>
              <Link
                to="/PortfolioPrices"
                className={`NavBar${address ? "" : " disabled"}`}
              >
                <Button variant="uw"
                  sx={{
                    boxShadow: "var(--boxShadow)",
                  }}
                  startIcon={<VisibilityIcon />}
                >
                  Portfolio
                </Button>
              </Link>
              <Link
                to="/SwapTrade"
                className={`NavBar${address ? "" : " disabled"}`}
              >
                <Button variant="uw"
                  sx={{
                    boxShadow: "var(--boxShadow)",

                  }}
                  startIcon={<LoopIcon />}
                >
                  Trade
                </Button>
              </Link>
              <Link to="/BuySell" className="NavBar">
                <Button variant="uw"
                  sx={{
                    boxShadow: "var(--boxShadow)",
                  }}
                  startIcon={<LinkIcon />}
                >
                  Buy Crypto
                </Button>
              </Link>

              <Link
                to="/SendRecieve"
                className={`NavBar${address ? "" : " disabled"}`}
              >
                <Button variant="uw"
                  sx={{
                    boxShadow: "var(--boxShadow)",
                  }}
                  startIcon={<MailIcon />}
                >
                  Send/Recieve
                </Button>
              </Link>
            </Stack>
            <Switch>
              <CryptoRoute
                exact
                path="/PortfolioPrices"
                component={PortfolioPrices}
                address={address}
              />
              <CryptoRoute
                exact
                path="/SwapTrade"
                component={SwapTrade}
                address={address}
              />
              <Route exact path="/BuySell">
                <BuySell />
              </Route>
              <CryptoRoute
                exact
                path="/SendRecieve"
                component={SendReceive}
                address={address}
              />
              <Redirect to={isOnlyMatic ? "/SwapTrade" : "/PortfolioPrices"} />
            </Switch>
          </BrowserRouter>
        ) : (
          <BottomFooter />
        )}
      </Stack>
    </Box>
  );
}

export default App;
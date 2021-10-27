import { useMoralis } from "react-moralis";
import { BrowserRouter, Link, Switch, Route, Redirect } from "react-router-dom";

import { Box, Button, Stack } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LoopIcon from '@mui/icons-material/Loop';
import LinkIcon from '@mui/icons-material/Link';
import MailIcon from '@mui/icons-material/Mail';

import { TopNavBar } from './Screens/TopNavBar';
import { ExpertStage } from "./Screens/ExpertStage";
import { PortfolioPrices } from "./Screens/PortfolioPrices";
import { SwapTrade } from "./Screens/SwapTrade";
import { BuySell } from "./Screens/BuySell";
import { SendReceive } from "./Screens/SendReceive";
import { BottomFooter } from "./Screens/BottomFooter";


import "./App.scss";


function App() {
  const { isAuthenticated } = useMoralis();
  
  var paddingLeft = { paddingLeft: "10px" };

  return (
    <Box>
      <Stack>
        <TopNavBar />
        <ExpertStage />
        {isAuthenticated ? (
          <BrowserRouter>
            <Stack direction="row" sx={{justifyContent:'center', mb:2}} spacing={1}>
              <Link to="/PortfolioPrices" className="NavBar">
                <Button variant="uw" 
                  sx={{ 
                    boxShadow: "var(--boxShadow)",
                   }}
                  startIcon={<VisibilityIcon />}
                >
                  Portfolio
                </Button>
              </Link>
              <Link to="/SwapTrade" className="NavBar" style={paddingLeft}>
                <Button variant="uw"
                  sx={{ 
                    boxShadow: "var(--boxShadow)",
                
                   }}
                  startIcon={<LoopIcon />}
                >
                  Trade
                </Button>
              </Link>
             <Link to="/BuySell" className="NavBar" style={paddingLeft}>
                <Button variant="uw"
                  sx={{ 
                    boxShadow: "var(--boxShadow)",
                   }}
                  startIcon={<LinkIcon />}
                >
                  Buy Crypto
                </Button>
              </Link>

              <Link to="/SendRecieve" className="NavBar" style={paddingLeft}>
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
              <Route exact path="/PortfolioPrices">
                <PortfolioPrices />
              </Route>
              <Route exact path="/SwapTrade">
                <SwapTrade />
              </Route>
              <Route exact path="/BuySell">
                <BuySell />
              </Route>
              <Route exact path="/SendRecieve">
                <SendReceive />
              </Route>
              <Redirect to="/PortfolioPrices" />
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
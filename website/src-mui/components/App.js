import { useMoralis } from "react-moralis";
import { BrowserRouter, Link, Switch, Route } from "react-router-dom";

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

import { useColorMode } from '../contexts/colorModeContext';
import { useGradient } from "../contexts/gradientsContext";

import "./App.css";


function App() {
  const { isAuthenticated } = useMoralis();
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG, darkBoxShadow } = useGradient();
  
  var paddingLeft = { paddingLeft: "10px" };

  return (
    <Box sx={{ backgroundImage: (colorMode === 'light' ? lightModeBG : darkModeBG), minHeight: '100vh' }}>
      <Stack>
        <TopNavBar />
        <ExpertStage />
        {isAuthenticated ? (
          <BrowserRouter>
            <Stack direction="row" sx={{justifyContent:'center', mb:2}} spacing={1}>
              <Link to="/PortfolioPrices" className="NavBar">
                <Button variant="uw" 
                  sx={{ 
                    boxShadow: darkBoxShadow,
                   }}
                  startIcon={<VisibilityIcon />}
                >
                  Portfolio
                </Button>
              </Link>
              <Link to="/SwapTrade" className="NavBar" style={paddingLeft}>
                <Button variant="uw"
                  sx={{ 
                    boxShadow: darkBoxShadow,
                
                   }}
                  startIcon={<LoopIcon />}
                >
                  Trade
                </Button>
              </Link>
             <Link to="/BuySell" className="NavBar" style={paddingLeft}>
                <Button variant="uw"
                  sx={{ 
                    boxShadow: darkBoxShadow,
                   }}
                  startIcon={<LinkIcon />}
                >
                  Buy Crypto
                </Button>
              </Link>

              <Link to="/SendRecieve" className="NavBar" style={paddingLeft}>
                <Button variant="uw"
                 sx={{ 
                    boxShadow: darkBoxShadow,
                   }}
                  startIcon={<MailIcon />}
                >
                  Send/Recieve
                </Button>
              </Link>
            </Stack>
            <Switch>
              <Route exact path="/" component={PortfolioPrices} />
              <Route path="/PortfolioPrices" component={PortfolioPrices} />
              <Route path="/SwapTrade" component={SwapTrade} />
              <Route path="/BuySell" component={BuySell} />
              <Route path="/SendRecieve" component={SendReceive} />
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
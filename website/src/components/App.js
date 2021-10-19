import "./App.css";
import { BrowserRouter, Link, Switch, Route } from "react-router-dom";
import { Button, VStack, HStack, useColorMode } from "@chakra-ui/react";
import { EmailIcon, LinkIcon, RepeatIcon, ViewIcon } from "@chakra-ui/icons";

import { useMoralis } from "react-moralis";

import { TopNavBar } from "./Screens/TopNavBar";
import { ExpertStage } from "./Screens/ExpertStage";
import { BuySell } from "./Screens/BuySell";
import { PortfolioPrices } from "./Screens/PortfolioPrices";
import { SendReceive } from "./Screens/SendReceive";
import { SwapTrade } from "./Screens/SwapTrade";
import { BottomFooter } from "./Screens/BottomFooter";

import { useGradient } from "../contexts/gradientsContext";

function App() {
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();
  const { isAuthenticated } = useMoralis();

  var paddingLeft = { paddingLeft: "10px" };
  return (
    <VStack
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
      style={{ minHeight: "100vh", backgroundAttachment: "fixed" }}
    >
      <br />
      <TopNavBar />
      <ExpertStage />
      {isAuthenticated ? (
        <BrowserRouter>
          <HStack>
            <Link to="/PortfolioPrices" className="NavBar">
              <Button
                leftIcon={<ViewIcon />}
                boxShadow="dark-lg"
                variant={colorMode === "light" ? "outline" : "solid"}
              >
                Portfolio
              </Button>
            </Link>
            <Link to="/SwapTrade" className="NavBar" style={paddingLeft}>
              <Button
                leftIcon={<RepeatIcon />}
                boxShadow="dark-lg"
                variant={colorMode === "light" ? "outline" : "solid"}
              >
                Trade
              </Button>
            </Link>
            <Link to="/BuySell" className="NavBar" style={paddingLeft}>
              <Button
                leftIcon={<LinkIcon />}
                boxShadow="dark-lg"
                variant={colorMode === "light" ? "outline" : "solid"}
              >
                Buy Crypto
              </Button>
            </Link>
            <Link to="/SendRecieve" className="NavBar" style={paddingLeft}>
              <Button
                leftIcon={<EmailIcon />}
                boxShadow="dark-lg"
                variant={colorMode === "light" ? "outline" : "solid"}
              >
                Send/Recieve
              </Button>
            </Link>
          </HStack>
          <br />
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
      <br />
    </VStack>
  );
}

export default App;

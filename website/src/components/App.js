import "./App.css";
import { BrowserRouter, Link, Switch, Route } from "react-router-dom";
import { Button, VStack, HStack, useColorMode } from "@chakra-ui/react";
import { EmailIcon, LinkIcon, RepeatIcon, ViewIcon } from "@chakra-ui/icons";

import { useMoralis } from "react-moralis";

import { TopNavBar } from "../components/Pages/TopNavBar";
import { ExpertStage } from "../screens/ExpertStage";
import { BuySell } from "../screens/BuySell";
import { PortfolioPrices } from "../screens/PortfolioPrices";
import { SendReceive } from "../screens/SendReceive";
import { SwapTrade } from "../screens/SwapTrade";
import { BottomFooter } from "../screens/BottomFooter";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

function App() {
  const { colorMode } = useColorMode();
  const { isAuthenticated } = useMoralis();

  var paddingLeft = { paddingLeft: "10px" };
  return (
    <VStack
      height="100vh"
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
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
                Convert USD
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
    </VStack>
  );
}

export default App;

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import reportWebVitals from "./components/Support/reportWebVitals";

import { MoralisProvider } from "react-moralis";
import { ExpertsProvider } from "./contexts/expertsContext";
import { ActionsProvider } from "./contexts/actionsContext";
import { QuoteProvider } from "./contexts/quoteContext";
import { NetworkProvider } from "./contexts/networkContext";

import { ColorModeProvider } from "./contexts/colorModeContext";

console.groupCollapsed("index.js");
console.log(`Executing against ${process.env.NODE_ENV} mode!`);
console.groupEnd();

const appId = process.env.REACT_APP_MORALIS_APPLICATION_ID;
const serverUrl = process.env.REACT_APP_MORALIS_SERVER_URL;

ReactDOM.render(
  <React.StrictMode>
    <ColorModeProvider>
      <MoralisProvider appId={appId} serverUrl={serverUrl}>
        <NetworkProvider>
          <ExpertsProvider>
            <ActionsProvider>
              <QuoteProvider>
                <App />
              </QuoteProvider>
            </ActionsProvider>
          </ExpertsProvider>
        </NetworkProvider>
      </MoralisProvider>
    </ColorModeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

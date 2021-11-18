import React, { useEffect } from "react";
import { AppNavigator } from "./navigation";

import { ExpertsProvider } from './contexts/expertsContext';
import { ActionsProvider } from './contexts/actionsContext';
import { QuoteProvider } from './contexts/quoteContext';
import { PortfolioProvider } from './contexts/portfolioContext';
import { NetworkProvider } from './contexts/networkContext';


function App(): JSX.Element {

  return (
    <ExpertsProvider>
      <ActionsProvider>
        <QuoteProvider>
          <NetworkProvider>
            <PortfolioProvider>
              <AppNavigator />
            </PortfolioProvider>
          </NetworkProvider>
        </QuoteProvider>
      </ActionsProvider>
    </ExpertsProvider>

  );
}

export default App;
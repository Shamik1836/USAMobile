import React, { useState, useContext } from "react";
import { usePositions } from "../hooks/usePositions";

const PortfolioContext = React.createContext();

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider = (props) => {
  const { positions } = usePositions();
  const [portfolio, setPortfolio] = useState([]);
  const [totalBalance, setTotalBalance] = useState(-1);
  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        setPortfolio,
        totalBalance,
        setTotalBalance,
        positions,
      }}
    >
      {props.children}
    </PortfolioContext.Provider>
  );
};

export default PortfolioContext;

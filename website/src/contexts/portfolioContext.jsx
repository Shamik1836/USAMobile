import React, { useState, useEffect, useContext } from "react";
import { useMoralis } from "react-moralis";
import { usePositions } from "../hooks/usePositions";

const PortfolioContext = React.createContext();

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider = (props) => {
  const { isAuthenticated } = useMoralis();
  const { positions } = usePositions();
  const [portfolio, setPortfolio] = useState([]);
  const [totalBalance, setTotalBalance] = useState(-1);
  return (
    <PortfolioContext.Provider value={{ portfolio, totalBalance, positions }}>
      {props.children}
    </PortfolioContext.Provider>
  );
};

export default PortfolioContext;

import React, { useContext } from "react";

const GradientContext = React.createContext();

export const useGradient = () => useContext(GradientContext);

export const GradientProvider = (props) => {
 
  const lightModeBG = "linear-gradient(to bottom right, #4299e1, #fc8181, #ffffff, #fc8181, #ffffff)";
  const darkModeBG = "linear-gradient(to bottom right, #1a365d, grey, #1a365d, #808080, #1a365d)";
  const darkBoxShadow = '#0000001a 0px 0px 0px 1px, #00000033 0px 5px 10px 0px, #00000066 0px 15px 40px 0px';

  return (
    <GradientContext.Provider value={{ lightModeBG, darkModeBG, darkBoxShadow }}>
      {props.children}
    </GradientContext.Provider>
  );
};

export default GradientContext;

import React, { useContext } from "react";

const GradientContext = React.createContext();

export const useGradient = () => useContext(GradientContext);

export const GradientProvider = (props) => {
  const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
  const darkModeBG = "linear(to-br,blue.900,grey,blue.900,grey,blue.900)";

  return (
    <GradientContext.Provider value={{ lightModeBG, darkModeBG }}>
      {props.children}
    </GradientContext.Provider>
  );
};

export default GradientContext;

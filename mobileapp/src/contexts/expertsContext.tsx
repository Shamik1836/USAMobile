import React, { useState, useContext } from 'react';

// @ts-ignore
const ExpertsContext = React.createContext<any>();

export const useExperts = () => useContext(ExpertsContext);

export const ExpertsProvider = (props) => {
  const [expertsOn, toggleExperts] = useState(true);
  const [actionMode, setActionMode] = useState('idle');
  const [dialog, setDialog] = useState('');

  return (
    <ExpertsContext.Provider
      value={{
        expertsOn,
        toggleExperts,
        actionMode,
        setActionMode,
        dialog,
        setDialog,
      }}
    >
      {props.children}
    </ExpertsContext.Provider>
  );
};

export default ExpertsContext;

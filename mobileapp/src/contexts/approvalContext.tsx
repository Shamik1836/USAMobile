import React, { useState, useContext } from 'react';

// @ts-ignore
const ApprovalContext = React.createContext<any>();

export const useApproval = () => useContext(ApprovalContext);

export const ApprovalProvider = (props) => {
  const [isApproved, setIsApproved] = useState(false);

  return (
    <ApprovalContext.Provider value={{ isApproved, setIsApproved }}>
      {props.children}
    </ApprovalContext.Provider>
  );
};

export default ApprovalContext;

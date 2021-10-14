import { useEffect } from "react";
import { Flex } from "@chakra-ui/react";
import { useMoralis } from "react-moralis";
import ENSAddress from "@ensdomains/react-ens-address";
import { useActions } from "../../contexts/actionsContext";
import "./ToAddress.css";

export const ToAddress = () => {
  const { web3, enableWeb3, isWeb3Enabled } = useMoralis();
  const { setToSymbol, setToAddress, setToENSType } = useActions();

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3();
    }
  }, [isWeb3Enabled, enableWeb3]);

  return (
    <Flex width="100%">
      {isWeb3Enabled && (
        <ENSAddress
          provider={web3.givenProvider || web3.currentProvider}
          onResolve={({ name, address, type }) => {
            if (
              type &&
              address !== undefined &&
              address !== "0x0000000000000000000000000000000000000000"
            ) {
              setToSymbol(name);
              setToAddress(address);
              setToENSType(type);
              console.groupCollapsed("ToAddress");
              console.log("ENS Resolved To:", {
                name: name,
                address: address,
                type: type,
              });
              console.groupEnd();
            }
          }}
        />
      )}
    </Flex>
  );
};

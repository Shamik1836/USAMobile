import {
  IconButton,
  Text,
  HStack,
  VStack,
  useColorMode,
} from "@chakra-ui/react";
import { useMoralis } from "react-moralis";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useState, useEffect } from "react";
import { useExperts } from "../../contexts/expertsContext";
import { CopyIcon } from "@chakra-ui/icons";
import EthereumQRPlugin from "ethereum-qr-code";
const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

export const AddressPanel = () => {
  const { Moralis, isAuthenticated } = useMoralis();
  const { colorMode } = useColorMode();
  const { setActionMode, setDialog } = useExperts();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState("0x0");
  const user = Moralis.User.current();
  const ethAddress = user?.attributes.ethAddress;
  const qr = new EthereumQRPlugin();

  useEffect(() => {
    if (copied) {
      setActionMode("recieve");
      setDialog(
        "Your wallet address has been copied to the clipboard.  " +
          "Paste your address as the destination " +
          "in the market withdraw or send entry, " +
          "then carefully check the address before sending!  " +
          "Malware can change your destination address in the clipboard!"
      );
      setCopied(false);
    } else {
      if (isAuthenticated) {
        setData(user?.attributes["ethAddress"]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copied, isAuthenticated]);

  return (
    <VStack
      alignItems="center"
      justifyContent="center"
      borderWidth={2}
      borderRadius="3xl"
      paddingLeft={10}
      paddingRight={10}
      paddingTop={5}
      paddingBottom={5}
      spacing={6}
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
    >
      <Text>Your Address:</Text>
      <HStack>
        <Text>{ethAddress}</Text>
        <CopyToClipboard text={data} onCopy={() => setCopied(true)}>
          <IconButton
            disabled={!isAuthenticated}
            variant="outline"
            aria-label="Copy Address to Clipboard"
            icon={<CopyIcon />}
          />
        </CopyToClipboard>
      </HStack>
    </VStack>
  );
};

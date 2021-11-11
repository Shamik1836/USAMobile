import React from "react";
import { MoralisProvider } from "react-moralis";
import Moralis from "moralis/react-native.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enableViaWalletConnect } from "./Moralis/enableViaWalletConnect";

import WalletConnectProvider from '@walletconnect/react-native-dapp';
import { Platform } from "react-native";
import { expo } from "../app.json";

const { scheme } = expo;

/**
 * Initialization of Moralis
 */
const appId = "Yp4jqCYDS3aNQD5KDUegQ633MIFe4ikP5oJDFaJ7"; // Application id from moralis.io
const serverUrl = "https://vscjt8ylh8co.usemoralis.com:2053/server"; //Server url from moralis.io
const environment = "native";
const getMoralis = () => Moralis;
// Initialize Moralis with AsyncStorage to support react-native storage
Moralis.setAsyncStorage(AsyncStorage);
// Replace the enable function to use the react-native WalletConnect
// @ts-ignore
Moralis.setEnableWeb3(enableViaWalletConnect);

const walletConnectOptions = {
  redirectUrl: Platform.OS === "web" ? window.location.origin : `${scheme}://`,
  storageOptions: {
    asyncStorage: AsyncStorage,
  }
};

export const Providers = ({ children }) => {
  return (
    <WalletConnectProvider {...walletConnectOptions}>
      <MoralisProvider appId={appId} serverUrl={serverUrl} environment={environment} getMoralis={getMoralis}>
        {children}
      </MoralisProvider>
    </WalletConnectProvider>
  );
};

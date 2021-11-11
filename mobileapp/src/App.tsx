import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMoralis, useMoralisWeb3Api, useMoralisWeb3ApiCall } from "react-moralis";

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  white: { backgroundColor: "white" },
  margin: { marginBottom: 20 },
  marginLarge: { marginBottom: 35 },
});

function App(): JSX.Element {
  const { authenticate, authError, isAuthenticating, isAuthenticated, logout, Moralis } = useMoralis();

  return (
    <View style={[StyleSheet.absoluteFill, styles.center, styles.white]}>
      <View style={styles.marginLarge}>
        {authError && (
          <>
            <Text>Authentication error:</Text>
            <Text style={styles.margin}>{authError.message}</Text>
          </>
        )}
        {isAuthenticating && <Text style={styles.margin}>Authenticating...</Text>}
        {!isAuthenticated && (
          // @ts-ignore
          <TouchableOpacity onPress={() => authenticate()}>
            <Text>Authenticate</Text>
          </TouchableOpacity>
        )}
        {isAuthenticated && (
          <TouchableOpacity onPress={() => logout()}>
            <Text>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default App;

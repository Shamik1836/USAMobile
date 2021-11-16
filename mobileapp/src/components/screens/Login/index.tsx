import React from "react";
import { View, Text, Image } from "react-native";
import { useNavigation } from '@react-navigation/native';

import { Button, TextButton } from '../../common/button'
import { TextField } from '../../common/forms'
import styles from './styles';


// Interfaces
interface IProps { }


const Login: React.FC<IProps> = () => {
  const navigation = useNavigation();

  const handleSignupButtonClick = (screenName) => {
    navigation.navigate(screenName);
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image style={styles.logo} source={require('../../../media/logo.png')} />
      </View>
      <View style={styles.bodyWrapper}>
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <TextField
              label={'User Name'}
              onChange={(value) => console.log(value)}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextField
              label={'Password'}
              onChange={(value) => console.log(value)}
            />
          </View>
        </View>
         <View style={styles.loginBtnWrapper}>
          <Button label="Log In" onPress={() => console.log('Login Clicked')} />
        </View>
        <View style={styles.formBottomTextWrapper}>
          <Text> You don't have an account yet?</Text>
          <TextButton textStyle={{fontWeight: '800', textDecorationLine:'underline'}} label="Register here" onPress={() => handleSignupButtonClick('Signup')} />
        </View>
      </View>
    </View>
  );
}

export default Login;









// import React, { useEffect } from "react";
// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { useMoralis, useMoralisWeb3Api, useMoralisWeb3ApiCall } from "react-moralis";
// import { useWalletConnect } from "./WalletConnect";

// const styles = StyleSheet.create({
//   center: { alignItems: "center", justifyContent: "center" },
//   white: { backgroundColor: "white" },
//   margin: { marginBottom: 20 },
//   marginLarge: { marginBottom: 35 },
// });

// function App(): JSX.Element {
//   const connector = useWalletConnect();
//   const { authenticate, authError, isAuthenticating, isAuthenticated, logout, Moralis } = useMoralis();

//   return (
//     <View style={[StyleSheet.absoluteFill, styles.center, styles.white]}>
//       <View style={styles.marginLarge}>
//         {authError && (
//           <>
//             <Text>Authentication error:</Text>
//             <Text style={styles.margin}>{authError.message}</Text>
//           </>
//         )}
//         {isAuthenticating && <Text style={styles.margin}>Authenticating...</Text>}
//         {!isAuthenticated && (
//           // @ts-ignore
//           <TouchableOpacity onPress={() => authenticate({ connector })}>
//             <Text>Authenticate</Text>
//           </TouchableOpacity>
//         )}
//         {isAuthenticated && (
//           <TouchableOpacity onPress={() => logout()}>
//             <Text>Logout</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// }

// export default App;

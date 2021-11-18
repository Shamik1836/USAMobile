import React, {useState} from "react";
import { View, Text, Image } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useMoralis } from "react-moralis";

import { Button, TextButton } from '../../common/button'
import { TextField } from '../../common/forms'
import styles from './styles';


// Interfaces
interface IProps { }


const Login: React.FC<IProps> = () => {
  const [email, setEmail] =  useState('');
  const [password, setPassword] =  useState('');

  const navigation = useNavigation();
  const { login } = useMoralis();

  const handleLoginClick = () =>{
    console.groupCollapsed('handleLoginClick');
    console.log('UserName:', email);
    console.log('Password:', password);
    console.groupEnd();
    login(email, password === '' ? undefined : password, {
      usePost: true,
    })
    .then(result=>{
      console.log('LoginSuccess:', result);
    },error=>{
       console.log('LoginError:', error);
    })
    .catch(error=>{
      console.log('LoginCatchError:', error);
    });
  }

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
              label={'Email'}
              value={email}
              onChange={(value) => setEmail(value)}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextField
              label={'Password'}
              value={password}
              secureTextEntry
              onChange={(value) => setPassword(value)}
            />
          </View>
        </View>
         <View style={styles.loginBtnWrapper}>
          <Button label="Log In" onPress={handleLoginClick} />
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
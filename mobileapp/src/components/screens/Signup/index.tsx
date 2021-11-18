import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useMoralis } from "react-moralis";


import { Button, TextButton } from '../../common/button'
import { TextField } from '../../common/forms'
import styles from './styles';


// Interfaces
interface IProps { }


const Signup: React.FC<IProps> = () => {

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const { signup } = useMoralis();


  const handleSignupClick = () => {
    console.groupCollapsed('handleSignupClick');
    console.log('UserName:', userName);
    console.log('Email:', email);
    console.log('Password:', password);
    console.groupEnd();
    signup(userName ? userName : email, password, email, { usePost: true })
      .then(result => {
        console.log('SignupSuccess:', result);
      }, error => {
        console.log('SignupError:', error);
      })
      .catch(error => {
        console.log('SignupCatchError:', error);
      });
  }

  const handleLoginButtonClick = (screenName) => {
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
              label={'User Name'}
              value={userName}
              onChange={(value) => setUserName(value)}
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
        <View style={styles.signupBtnWrapper}>
          <Button label="Signup" onPress={handleSignupClick} />
        </View>
        <View style={styles.formBottomTextWrapper}>
          <Text> You have an account already?</Text>
          <TextButton textStyle={{ fontWeight: '800', textDecorationLine: 'underline' }} label="Log In here" onPress={() => handleLoginButtonClick('Login')} />
        </View>
      </View>
    </View>
  );
}

export default Signup;


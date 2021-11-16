import React from "react";
import { View, Text, Image } from "react-native";
import { useNavigation } from '@react-navigation/native';

import { Button, TextButton } from '../../common/button'
import { TextField } from '../../common/forms'
import styles from './styles';


// Interfaces
interface IProps { }


const Signup: React.FC<IProps> = () => {
  const navigation = useNavigation();

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
              label={'User Name'}
              onChange={(value) => console.log(value)}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextField
              label={'Email'}
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
        <View style={styles.signupBtnWrapper}>
          <Button label="Signup" onPress={() => console.log('Signup Clicked')} />
        </View>
        <View style={styles.formBottomTextWrapper}>
          <Text> You have an account already?</Text>
          <TextButton textStyle={{fontWeight: '800', textDecorationLine:'underline'}} label="Log In here" onPress={() => handleLoginButtonClick('Login')} />
        </View>
      </View>
    </View>
  );
}

export default Signup;


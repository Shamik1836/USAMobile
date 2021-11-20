import React from "react";
import { View, Text, Image } from "react-native";
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../Common/Button'
import styles from './styles';


// Interfaces
interface IProps {}


const Welcome: React.FC<IProps> = () => {
  const navigation = useNavigation();

  const handleButtonClick = (screenName) =>{
    navigation.navigate(screenName);
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image style={styles.logo} source={require('../../../media/logo.png')} />
      </View>
      <View style={styles.bodyWrapper}>
        <Text style={styles.pageLabel}>This is Our Welcome Page, We will add Slider/Explorer Slides here.</Text>
         <View style={styles.buttonsWrapper}>
           <Button label="Create Account" touchableStyle={{marginBottom: 5}} onPress={() => handleButtonClick('Signup')} />
           <Button label="Login" onPress={() => handleButtonClick('Login')} />
         </View>
      </View>
    </View>
  );
}


export default Welcome;






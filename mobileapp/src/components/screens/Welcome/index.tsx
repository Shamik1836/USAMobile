import React from "react";
import { View, Text } from "react-native";
import { TextButton } from '../../common'
import styles from './styles';


// Interfaces
interface IProps {}


const Welcome: React.FC<IProps> = ()=>{
  return(
    <View style={styles.container}>
      <Text style={styles.pageLabel}>This is Our Welcome Page, We will add Slider/Explorer Slides here.</Text>
      <TextButton label="Create Account" onPress={()=> { console.log('test'); }}/>
      <TextButton label="Login" onPress={()=> { console.log('test'); }}/>
    </View>
  );
}


export default Welcome;






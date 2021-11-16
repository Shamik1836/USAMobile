import React from "react";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import { TouchableHighlightProperties, StyleProp, TextStyle, TextProperties, ViewStyle} from "react-native";

interface IProps extends TouchableHighlightProperties {
  label: string;
  disabled?: boolean;
  touchableStyle?:StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  onPress: () =>void;
}



const Button = ({ label, disabled, onPress, touchableStyle, textStyle, ...props }:IProps) => (
    <TouchableHighlight
      onPress={onPress} 
      disabled={disabled}
      style={[styles.container, touchableStyle]}
      {...props}
    >
        <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableHighlight>
)

export default Button;

const styles = StyleSheet.create({
  container:{
  	width: '100%',
  	alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    minHeight: 40,
    borderRadius: 2,
    backgroundColor: '#00069b'
  },
  label:{
  	color: 'white'
  }
});





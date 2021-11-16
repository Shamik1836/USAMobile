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



const OutlineButton = ({ label, disabled, onPress, touchableStyle, textStyle, ...props }:IProps) => (
    <TouchableHighlight
      onPress={onPress} 
      disabled={disabled}
      style={[styles.container, touchableStyle]}
      {...props}
    >
        <Text style={textStyle}>{label}</Text>
    </TouchableHighlight>
)

export default OutlineButton;

const styles = StyleSheet.create({
  container:{
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 5,
    minHeight: 40,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#00069b'
  }
});





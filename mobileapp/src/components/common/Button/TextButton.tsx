import React from "react";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import { TouchableHighlightProperties, StyleProp, TextStyle, TextProperties, ViewStyle} from "react-native";

interface IProps extends TouchableHighlightProperties {
  label: string;
  disabled?: boolean;
  touchableStyle?:StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>,
  onPress: () =>void;
}



const TextButton = ({ label, disabled, onPress, touchableStyle, textStyle, ...props }:IProps) => (
    <TouchableHighlight
      onPress={onPress} 
      disabled={disabled}
      style={touchableStyle}
      {...props}
    >
        <Text style={textStyle}>{label}</Text>
    </TouchableHighlight>
)

export default TextButton;

const styles = StyleSheet.create({});





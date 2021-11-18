import React, { Component } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { StyleProp, ViewStyle} from "react-native";

interface IProps {
  containerStyle?: StyleProp<ViewStyle>
}

const FieldContainer:React.FC<IProps> = ({ containerStyle, children }) =>{
 
    return (
        <View style={[styles.contentContainer, containerStyle]}>{children}</View>
    );
}

export default FieldContainer;


const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
});

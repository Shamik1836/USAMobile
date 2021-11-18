import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, View } from 'react-native';
import { TextInputProps, StyleProp, TextStyle, TextProperties, ViewStyle } from 'react-native';

// Custom imports:
import { FieldContainer } from './';

interface IProps {
	label: string;
	labelStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	secureTextEntry?: boolean;
	value?: string;
	onChange: (value) => void;

}

const TextField: React.FC<IProps> = ({ label, labelStyle, containerStyle, onChange, children, ...props }) => {
	const [isFocused, setFocused] = useState(false);

	const handleFocus = () => setFocused(true);
	const handleBlur = () => setFocused(false);

	return (
		<FieldContainer containerStyle={containerStyle}>
			<Text style={labelStyle}>
				{label}
			</Text>
			<TextInput
				style={[styles.inputStyle]}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onChangeText={onChange}
				{...props}
			/>
		</FieldContainer>

	);
}

export default TextField;

const styles = StyleSheet.create({
	inputStyle: {
		padding: 8,
		borderRadius:2,
		borderWidth: 1,
		borderColor:'gray'
	}
});

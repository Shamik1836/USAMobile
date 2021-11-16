import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	container:{
		flex: 1,
    	alignItems: 'center',
    	padding: 10
	},
	logoWrapper:{
		flex: 1,
		alignItems: 'center',
    	justifyContent: 'center'

	},
	logo:{
		width: 250,
		height: 60,
		resizeMode: 'contain'
	},
	bodyWrapper:{
		flex: 2,
		width: '100%',
		alignItems: 'center',
	},
	form:{
		width: '80%'
	},
	inputWrapper:{},
	loginBtnWrapper:{
		width:'80%',
		paddingHorizontal: 8, 
		marginTop: 32
	},
	formBottomTextWrapper:{
		width:'80%',
		paddingHorizontal: 8,
		marginTop: 16,
		alignItems: 'center' 
	}
});

export default styles;

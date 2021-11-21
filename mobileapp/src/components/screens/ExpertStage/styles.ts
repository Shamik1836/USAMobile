import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	container:{
		display: 'flex',
    	alignItems: 'center',
    	padding: 10
	},
	expertCardWrapper:{
		display: 'flex',
		width: '100%',
		flexDirection:'row',
		alignItems: 'flex-start',
		justifyContent: 'center'
		
	},
	textWrapper:{
		flex: 2,
		height:'100%',
		justifyContent: 'center'
	},
	iconWrapper:{
		flex: 1,
		justifyContent: 'center'
	},
	icon:{
		width:100,
		height: 100
	}
});

export default styles;

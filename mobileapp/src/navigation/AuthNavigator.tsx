import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen, LoginScreen, SignupScreen } from '../components/screens';

const Stack = createNativeStackNavigator();
const INITIAL_ROUTE_NAME = 'Welcome';
// const INITIAL_ROUTE_NAME = 'Login';
// const INITIAL_ROUTE_NAME = 'Signup';

const AuthNavigator = () => {
	return (
		<Stack.Navigator
			initialRouteName={INITIAL_ROUTE_NAME}
			screenOptions={{
				headerShown: false
			}}
		>
			<Stack.Screen name="Welcome" component={WelcomeScreen} />
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Signup" component={SignupScreen} />
		</Stack.Navigator>
	);
}

export default AuthNavigator;




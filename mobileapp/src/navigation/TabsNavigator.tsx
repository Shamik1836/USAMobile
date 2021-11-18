import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { PortfolioPricesScreen, SwapTradeScreen, BuySellScreen, SendReceiveScreen } from '../components/screens';

const Tab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = 'Portfolio';


const TabsNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Portfolio"
        component={PortfolioPricesScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = focused ? 'eye': 'eye';
            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Trade"
        component={SwapTradeScreen}
        options={{tabBarIcon: ({ focused, color, size }) =>  <Ionicons name='sync' size={size} color={color} />}}
        />
      <Tab.Screen
        name="Buy Crypto"
        component={BuySellScreen}
        options={{tabBarIcon: ({ focused, color, size }) =>  <Ionicons name='link' size={size} color={color} />}}
      />
      <Tab.Screen
        name="SendReceive"
        component={SendReceiveScreen}
        options={{tabBarIcon: ({ focused, color, size }) =>  <Ionicons name='mail' size={size} color={color} />}} 
      />
    </Tab.Navigator>
  );
}

export default TabsNavigator;



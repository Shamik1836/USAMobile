import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PortfolioPricesScreen, SendReceiveScreen} from '../components/screens';

const Tab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = 'Portfolio';


const TabsNavigator = () =>{
  return (
    <Tab.Navigator>
      <Tab.Screen name="Portfolio" component={PortfolioPricesScreen} />
      <Tab.Screen name="SendReceive" component={SendReceiveScreen} />
    </Tab.Navigator>
  );
}

export default TabsNavigator;



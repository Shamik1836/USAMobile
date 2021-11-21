import React from "react";
import { View, Text } from "react-native";
import ExpertStage from '../ExpertStage';


// Interfaces
interface IProps {}


const PortfolioPrices: React.FC<IProps> = ()=>{
  return(
    <View>
      <View>
        <ExpertStage />
      </View>
      <Text>This is Our PortfolioPrices Page</Text>
    </View>
  );
}


export default PortfolioPrices;






// import React from "react";
// import { Flex, Text, Image } from "@chakra-ui/react";

// function Card({ data }) {
//   const { market_data } = data;
//   return (
//     <div className="card">
//       <Flex alignItems="center">
//         <Image width="70px" height="70px" src={data.image.large} />
//         <div>
//           <Text>{data.name}</Text>
//           <Text>Currency</Text>
//         </div>
//       </Flex>
//       <Flex
//         justifyContent="space-between"
//         alignItems="flex-start"
//         marginTop="30px"
//       >
//         <div>
//           <Text className="title">Market Price</Text>
//           <Text className="price">${market_data.current_price.usd}</Text>
//           <Text className="title">{market_data.current_price.btc} BTC</Text>
//         </div>
//         <div>
//           <Text className="title">24H Change</Text>
//           <Text className="percent">
//             {market_data.price_change_percentage_24h}%
//           </Text>
//           <Text className="i-price">${market_data.price_change_24h}</Text>
//         </div>
//         <div>
//           <Text className="title">7D Change</Text>
//           <Text className="percent">
//             {market_data.price_change_percentage_7d}%
//           </Text>
//           <Text className="i-price">
//             $
//             {(market_data.current_price.usd *
//               market_data.price_change_percentage_7d) /
//               100}
//           </Text>
//         </div>
//       </Flex>
//       <Flex
//         justifyContent="space-between"
//         alignItems="flex-start"
//         marginTop="30px"
//       >
//         <div>
//           <Text className="title">Market Cap</Text>
//           <Text fontSize="14px" className="price">
//             ${market_data.market_cap.usd}
//           </Text>
//           <Text className="title">{market_data.market_cap.btc} BTC</Text>
//         </div>
//         <div>
//           <Text className="title">24H Volume</Text>
//           <Text className="title" fontSize="14px" opacity={1}>
//             ${market_data.market_cap_change_24h}
//           </Text>
//           <Text className="title">
//             {market_data.market_cap_change_24h_in_currency.btc} BTC
//           </Text>
//         </div>
//       </Flex>
//     </div>
//   );
// }

// export default Card;

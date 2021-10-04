import { VStack, useColorMode } from "@chakra-ui/react";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

export const AddressPanel = () => {
  const { colorMode } = useColorMode();
  return (
    <VStack
      alignItems="center"
      justifyContent="center"
      borderWidth={2}
      borderRadius="3xl"
      paddingLeft={10}
      paddingRight={10}
      paddingTop={5}
      paddingBottom={5}
      spacing={6}
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
    >
      Address Panel
    </VStack>
  );
};

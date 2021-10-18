import React, { useState } from "react";
import {
  Avatar,
  Box,
  Flex,
  Text,
  useColorMode,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { usePositions } from "../../hooks/usePositions";
import { TransactionList } from "./TransactionList";
import { getDataByCoinID } from "../../hooks/action";
import Card from "../Research/card";
import Loader from "../Research/load";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,blue.900,grey,blue.900)";

export const TokenTable = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCoin, setSelectedCoin] = useState(null);
  const { colorMode } = useColorMode();
  const { positions, isLoading, totalValue } = usePositions();
  const getDataApi = getDataByCoinID();
  const handleClickRow = async (p) => {
    onOpen();
    const data = await getDataApi(p.id);
    if (data.id) {
      setSelectedCoin(data);
    } else {
      onClose();
    }
  };
  return (
    <VStack
      borderWidth={4}
      borderRadius="3xl"
      width="100%"
      padding={5}
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
    >
      {!isLoading && (
        <Text>Total Value: ${parseFloat(totalValue).toFixed(2)}</Text>
      )}
      <Accordion allowToggle width="100%">
        {!isLoading &&
          positions.map((position) => (
            <AccordionItem
              key={position.name}
              width="100%"
              onClick={() => handleClickRow(position)}
            >
              <AccordionButton>
                <Flex gap={6}>
                  <Box width="50px">
                    <Avatar
                      name={position.symbol}
                      src={position.image}
                      size="sm"
                    />
                  </Box>
                  <Box width="80px">
                    <Text ml={2} textAlign="left">
                      {position.name}
                    </Text>
                  </Box>
                  <Box width="70px">
                    <Text ml={2} textAlign="left">
                      {position.tokens.toPrecision(3)}
                    </Text>
                  </Box>
                  <Box width="170px">
                    <Text ml={2} textAlign="left">
                      @ ${position.price && position.price.toFixed(2)}/
                      {position.symbol && position.symbol.toUpperCase()}
                    </Text>
                  </Box>
                  <Box width="80px">
                    <Text ml={2} textAlign="left">
                      {" "}
                      = ${position.value.toFixed(2)}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </Flex>
              </AccordionButton>
              <AccordionPanel pb={4}>
                {position.name === "Ether" && (
                  <TransactionList chain="eth" decimals={position.decimals} />
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
      </Accordion>
      <Modal isOpen={isOpen} onClose={onClose} size={"4xl"} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            {selectedCoin ? <Card data={selectedCoin} /> : <Loader />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

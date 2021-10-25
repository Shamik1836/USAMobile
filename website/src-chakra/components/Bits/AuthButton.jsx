import React from "react";
import "./AuthButton.css";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  useColorMode,
  useDisclosure,
  Tooltip,
} from "@chakra-ui/react";
import { LockIcon, UnlockIcon } from "@chakra-ui/icons";
import { useMoralis } from "react-moralis";
import { AuthDrawer } from "./AuthDrawer";

export const AuthButton = () => {
  const { isAuthenticated, logout } = useMoralis();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode } = useColorMode();

  return (
    <>
      {isAuthenticated ? (
        <Tooltip label="Log out of USA Wallet.">
          <IconButton
            aria-label="Log Out"
            icon={<UnlockIcon />}
            boxShadow="dark-lg"
            mr={2}
            mt={-2}
            variant={colorMode === "light" ? "outline" : "solid"}
            onClick={() => logout()}
          />
        </Tooltip>
      ) : (
        <>
          <Tooltip label="Log into USA Wallet.">
            <IconButton
              aria-label="Log In"
              icon={<LockIcon />}
              boxShadow="dark-lg"
              mr={2}
              mt={-2}
              variant={colorMode === "light" ? "outline" : "solid"}
              onClick={onOpen}
            />
          </Tooltip>
          <Drawer
            isOpen={isOpen}
            placement="right"
            onClose={onClose}
            className={`AuthDrawer ${
              colorMode === "light" ? "lightBG" : "darkBG"
            }`}
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Please sign in.</DrawerHeader>

              <DrawerBody>
                <AuthDrawer closeDrawer={onClose} />
              </DrawerBody>

              <DrawerFooter>
                <Tooltip label="Cancel identity action.">
                  <Button variant="outline" mr={3} onClick={onClose}>
                    Cancel
                  </Button>
                </Tooltip>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </>
  );
};

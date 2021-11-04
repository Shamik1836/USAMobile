import React from "react";
import MetaMaskOnboarding from "@metamask/onboarding";
import { Button } from "@mui/material";

import { ReactComponent as MetaMask } from '../../media/icons/metamask.svg';
import { useNetwork } from '../../contexts/networkContext';

const ONBOARD_TEXT = "Click here to install MetaMask!";
const CONNECT_TEXT = "Connect";

export function OnBoardingButton() {
	const [buttonText, setButtonText] = React.useState(ONBOARD_TEXT);
	const [isDisabled, setDisabled] = React.useState(false);
	const onboarding = React.useRef();
	const { accounts, setAccounts }= useNetwork();
	
	React.useEffect(() => {
		if (!onboarding.current) {
			onboarding.current = new MetaMaskOnboarding();
		}
	}, []);

	React.useEffect(() => {
		if (MetaMaskOnboarding.isMetaMaskInstalled()) {
			if (accounts.length > 0 || window.ethereum.selectedAddress) {
				setDisabled(true);
				onboarding.current.stopOnboarding();
			} else {
				setButtonText(CONNECT_TEXT);
				setDisabled(false);
			}
		}
	}, [accounts]);

	const onClick = () => {
		if (MetaMaskOnboarding.isMetaMaskInstalled()) {
			window.ethereum
				.request({ method: "eth_requestAccounts" })
				.then((newAccounts) => setAccounts(newAccounts));
		} else {
			onboarding.current.startOnboarding();
		}
	};

	if(isDisabled){
		return null;
	}
	return (
		<Button
			variant="uw"
			sx={{ alignSelf:"center", border:1, boxShadow: "var(--boxShadow)", borderColor:"var(--borderColor)", color:"var(--color)", height:40}}
			onClick={onClick}
			startIcon={<MetaMask/>}>
			{buttonText}
		</Button>
	);
}

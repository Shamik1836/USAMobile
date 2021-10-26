import { useState } from "react";

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useNetwork } from "../../contexts/networkContext";

export const NetworkSelect = () => {
	const { setNetworkId, setNetworkName } = useNetwork();
	const [ value, setValue ] =  useState('');

	const handleChange = async (e) => {
		let selectedOption = e.target.value;
		 setValue(selectedOption)
		 console.log("selectedOption:", selectedOption);
		 setNetworkName(selectedOption === "ethereum" ? "eth" : "polygon");
		 setNetworkId(selectedOption === "ethereum" ? 1 : 137);
	};

	return (
		<FormControl id="networkslct" fullWidth>
	        <InputLabel id="form-select-label">Select Network</InputLabel>
	        <Select
	          id="toToken"
	          placeholder="Select Network"
	          sx={{ width:750 }}
	          onChange={handleChange}
	          value = {value}
	        >
	          <MenuItem value='ethereum'>
				Ethereum
			</MenuItem>
			<MenuItem value='polygon'>
				Polygon
			</MenuItem>
	        </Select>
	      </FormControl>
		
	);
};

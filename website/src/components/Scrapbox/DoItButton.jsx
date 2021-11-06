import { useState } from 'react';
import { useMoralis } from 'react-moralis';
import { Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { useQuote } from '../../contexts/quoteContext';
import { useExperts } from '../../contexts/expertsContext';
import { useActions } from '../../contexts/actionsContext';
import { useNetwork } from '../../contexts/networkContext';

export const DoItButton = (props) => {
  const { Moralis, user } = useMoralis();
  const { networkAlias } = useNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const { setQuoteValid } = useQuote();
  const { fromToken, toToken, txAmount } = useActions();
  const { setDialog } = useExperts();

  const handlePress = async () => {
    setIsLoading(true);

    try {
      setDialog(
        'Retrieving pre-approval codes to swap ' + txAmount + ' of your ',
        fromToken.symbol.toUpperCase()
      );

      await Moralis.Plugins.oneInch.approve({
        chain: networkAlias,
        tokenAddress: fromToken.tokenAddress,
        fromAddress: user.attributes.ethAddress,
      });

      setDialog('Approval success.');

      await Moralis.Plugins.oneInch.swap({
        chain: networkAlias,
        fromTokenAddress: fromToken.tokenAddress,
        toTokenAddress: toToken.address,
        amount: txAmount,
        fromAddress: user.attributes.ethAddress,
        slippage: 3,
      });

      setDialog('Swap success.');
      setQuoteValid(0);
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  return (
    <Tooltip title="Submit swap order.">
      <LoadingButton
        className="ExpertButton"
        variant="contained"
        sx={{ boxShadow: 'var(--boxShadow)', mr: 2 }}
        onClick={handlePress}
        loading={isLoading}
      >
        Do it.
      </LoadingButton>
    </Tooltip>
  );
};

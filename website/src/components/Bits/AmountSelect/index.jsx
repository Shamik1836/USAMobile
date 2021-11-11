import { useRef, useEffect, useState } from 'react';

import { ReactComponent as SortSvg } from '../../../media/icons/sort.svg';
import { useActions } from '../../../contexts/actionsContext';
import { useExperts } from '../../../contexts/expertsContext';
import './styles.scss';

export const AmountSelect = ({ type }) => {
  const inputRef = useRef();
  const [value, setValue] = useState(0);
  const [amount, setAmount] = useState(0);
  const [usdAmount, setUSDAmount] = useState(0);
  const [isUSDMode, setIsUSDMode] = useState(false);
  const { fromToken, setTxAmount } = useActions();
  const { setDialog } = useExperts();
  const { price, tokens = 0, decimals = 18, symbol } = fromToken || {};

  useEffect(() => {
    return () => {
      setTxAmount(0);
    };
  }, [setTxAmount]);

  useEffect(() => {
    let v = Number(value) || 0;
    if (isUSDMode) {
      setUSDAmount(v);
      setAmount(v / price);
    } else {
      setAmount(v);
      setUSDAmount(v * price);
    }
  }, [isUSDMode, price, value]);

  useEffect(() => {
    if (amount <= tokens) {
      if (type === 'send') {
        setTxAmount(amount);
      } else {
        setTxAmount(amount * 10 ** decimals);
      }
    } else {
      setTxAmount(0);
    }

    if (amount > 0) {
      setDialog(
        'Now using ' +
          ((100 * amount) / tokens).toFixed(0) +
          '% of your ' +
          symbol +
          ' in this action.  ' +
          'Press one of the action buttons ' +
          'when you are ready ' +
          'to choose what to do with these tokens.'
      );
    } else {
      setDialog(
        'Use the up and down arrows ' +
          'to select how much ' +
          symbol +
          ' to use in this action.  ' +
          'Arrows step in 10% increments of your balance.'
      );
    }
  }, [amount, decimals, symbol, setDialog, setTxAmount, tokens, type]);

  const onChange = (e) => {
    const { value } = e.target;
    if (!value.match(/([^0-9.])|(\.\d*\.)/)) {
      setValue(value.match(/^0\d/) ? value.slice(1) : value);
    }
  };

  const onBlur = () => {
    if (value === '' || value === '.') {
      setValue(0);
    }
  };

  const toggleMode = () => {
    if (price) {
      if (isUSDMode) {
        setValue((value / price).toPrecision(3));
      } else {
        setValue((value * price).toFixed(2));
      }
      setIsUSDMode(!isUSDMode);
    }
    inputRef.current.focus();
  };

  return (
    <div className="amount-select">
      <div className="amount-select-field">
        <div className="amount-select-amount">
          <div data-value={value}>
            <input
              ref={inputRef}
              id="amount-input"
              autoFocus
              autoComplete="off"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              type="number"
              step={
                isUSDMode
                  ? ((price * tokens) / 10).toFixed(2)
                  : (tokens / 10).toPrecision(3)
              }
              max={isUSDMode ? price * tokens : tokens}
              min="0"
            />
          </div>
          <label htmlFor="amount-input">{isUSDMode ? 'USD' : symbol}</label>
        </div>
        <label
          htmlFor="amount-input"
          className="amount-select-converted-amount"
        >
          <span>
            {price
              ? isUSDMode
                ? `≈ ${amount.toPrecision(3)} ${symbol}`
                : `≈ $ ${usdAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} USD`
              : 'No Conversion Rate Available'}
          </span>
        </label>
        <div className="amount-select-swap-btn" onClick={toggleMode}>
          <SortSvg />
        </div>
      </div>
      {amount > tokens && (
        <div className="amount-select-error">Insufficient funds.</div>
      )}
    </div>
  );
};

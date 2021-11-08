import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function Card({ data, onClose }) {
  const { market_data, links } = data;
  const handleClick = (link) => {
    window.open(link, '_blank');
  };
  console.log(data);
  return (
    <Box className="card" sx={{ py: 1, px: 6 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 3.75,
        }}
      >
        <Box sx={{ display: 'flex' }}>
          <Box
            component="img"
            sx={{ height: 70, width: 70 }}
            src={data.image.large}
          />
          <Box className="header-title">
            <Typography>{data.name}</Typography>
            <Typography>Currency</Typography>
          </Box>
        </Box>
        <Box>
          <IconButton onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 3.75,
        }}
      >
        <Box>
          <Typography className="title">Market Price</Typography>
          <Typography className="price">
            ${market_data.current_price.usd}
          </Typography>
          <Typography className="title">
            {market_data.current_price.btc} BTC
          </Typography>
        </Box>
        <Box>
          <Typography className="title">1H Change</Typography>
          <Typography
            className={
              market_data.price_change_percentage_1h_in_currency.usd > 0
                ? 'percent'
                : 'percent negative'
            }
          >
            {market_data.price_change_percentage_1h_in_currency.usd}%
          </Typography>
        </Box>
        <Box>
          <Typography className="title">24H Change</Typography>
          <Typography
            className={
              market_data.price_change_percentage_24h > 0
                ? 'percent'
                : 'percent negative'
            }
          >
            {market_data.price_change_percentage_24h}%
          </Typography>
          <Typography
            className={
              market_data.price_change_24h > 0 ? 'i-price' : 'i-price negative'
            }
          >
            ${market_data.price_change_24h}
          </Typography>
        </Box>
        <Box>
          <Typography className="title">7D Change</Typography>
          <Typography
            className={
              market_data.price_change_percentage_7d > 0
                ? 'percent'
                : 'percent negative'
            }
          >
            {market_data.price_change_percentage_7d}%
          </Typography>
          <Typography
            className={
              market_data.price_change_percentage_7d > 0
                ? 'i-price'
                : 'i-price negative'
            }
          >
            $
            {(market_data.current_price.usd *
              market_data.price_change_percentage_7d) /
              100}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 3.75,
        }}
      >
        <Box>
          <Typography className="title">Market Cap</Typography>
          <Typography fontSize="14px" className="price">
            ${market_data.market_cap.usd}
          </Typography>
          <Typography className="title">
            {market_data.market_cap.btc} BTC
          </Typography>
        </Box>
        <Box>
          <Typography className="title">24H Volume</Typography>
          <Typography className="title" fontSize="14px" opacity={1}>
            ${market_data.market_cap_change_24h}
          </Typography>
          <Typography className="title">
            {market_data.market_cap_change_24h_in_currency.btc} BTC
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mt: 3.75,
        }}
      >
        {links.blockchain_site
          .filter((a) => a)
          .map((b) => (
            <Button
              onClick={() => handleClick(b)}
              variant="contained"
              size={links.blockchain_site.length > 5 ? 'small' : 'medium'}
            >
              {b.split('/')[2]}
            </Button>
          ))}
      </Box>
    </Box>
  );
}

export default Card;

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function Card({ data, onClose }) {
  const { market_data } = data;
  return (
    <Box className="card" sx={{ py: 1, px: 6 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 3.75,
        }}
      >
        <Box sx={{ display: "flex" }}>
          <Box
            component="img"
            sx={{ height: 70, width: 70 }}
            src={data.image.large}
          />
          <div className="header-title">
            <Typography>{data.name}</Typography>
            <Typography>Currency</Typography>
          </div>
        </Box>
        <Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 3.75,
        }}
      >
        <div>
          <Typography className="title">Market Price</Typography>
          <Typography className="price">
            ${market_data.current_price.usd}
          </Typography>
          <Typography className="title">
            {market_data.current_price.btc} BTC
          </Typography>
        </div>
        <div>
          <Typography className="title">24H Change</Typography>
          <Typography className="percent">
            {market_data.price_change_percentage_24h}%
          </Typography>
          <Typography className="i-price">
            ${market_data.price_change_24h}
          </Typography>
        </div>
        <div>
          <Typography className="title">7D Change</Typography>
          <Typography className="percent">
            {market_data.price_change_percentage_7d}%
          </Typography>
          <Typography className="i-price">
            $
            {(market_data.current_price.usd *
              market_data.price_change_percentage_7d) /
              100}
          </Typography>
        </div>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 3.75,
        }}
      >
        <div>
          <Typography className="title">Market Cap</Typography>
          <Typography fontSize="14px" className="price">
            ${market_data.market_cap.usd}
          </Typography>
          <Typography className="title">
            {market_data.market_cap.btc} BTC
          </Typography>
        </div>
        <div>
          <Typography className="title">24H Volume</Typography>
          <Typography className="title" fontSize="14px" opacity={1}>
            ${market_data.market_cap_change_24h}
          </Typography>
          <Typography className="title">
            {market_data.market_cap_change_24h_in_currency.btc} BTC
          </Typography>
        </div>
      </Box>
    </Box>
  );
}

export default Card;

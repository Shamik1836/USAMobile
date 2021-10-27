import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { Button,IconButton} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useExperts } from "../../contexts/expertsContext";


export const CopyAddress = (props) => {
  const { isAuthenticated, user } = useMoralis();
  const { setDialog } = useExperts();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState("0x0");

  useEffect(() => {
    if (copied) {
      setDialog(
        "Your wallet address has been copied to the clipboard.  " +
          "Paste your address as the destination " +
          "in the market withdraw or send entry, " +
          "then carefully check the address before sending!  " +
          "Malware can change your destination address in the clipboard!"
      );
      setCopied(false);
    } else {
      if (isAuthenticated) {
        setData(user?.attributes["ethAddress"]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copied, isAuthenticated]);

  return (
    <>
      <CopyToClipboard text={data} onCopy={() => setCopied(true)}>
        {props.mode === "copy" ? (
          <ContentCopyIcon sx={{
              width: 'auto',
              borderColor: '#e2e8f0 !important',
              border: 1,
              borderRadius: '.3rem',
              alignSelf: 'center',
              boxShadow: 'var(--boxShadow)',
              p:1
            }} />
        ) : (
          <Button disabled={!isAuthenticated} variant="contained" endIcon={<DownloadIcon />}>
            Receive
          </Button>
          
        )}
      </CopyToClipboard>
    </>
  );
};
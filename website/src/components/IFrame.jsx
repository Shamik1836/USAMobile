import React from "react";
import { Container, Skeleton } from "@chakra-ui/react";

export const IFrame = ({ source, title }) => {
  // prevent useless re-rendering
  const src = source;
  const frameTitle = title;

  return (
    // basic bootstrap classes.
    <Skeleton isLoaded={source}>
      <iframe
        title={frameTitle}
        src={src}
        width="600px"
        height="500px"
        bordreRadius="20px"
      />
    </Skeleton>
  );
};

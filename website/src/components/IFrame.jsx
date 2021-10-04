import React from "react";
import { Skeleton } from "@chakra-ui/react";

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
        width="525px"
        height="600px"
        frameborder="yes"
        bordrerRadius="20px"
        allow="accelerometer; autoplay; camera; gyroscope; payment;"
      />
    </Skeleton>
  );
};

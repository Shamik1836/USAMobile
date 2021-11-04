import React from 'react';
import { Skeleton } from '@mui/material';

export const IFrame = ({ source, title }) => {
  // prevent useless re-rendering
  const src = source;
  const frameTitle = title;

  // basic bootstrap classes.
  if (source) {
    return (
      <iframe
        title={frameTitle}
        src={src}
        width="525px"
        height="600px"
        frameborder="yes"
        bordrerRadius="20px"
        allow="accelerometer; autoplay; camera; gyroscope; payment;"
      />
    );
  } else {
    return <Skeleton variant="rectangular" width={525} height={600} />;
  }
};

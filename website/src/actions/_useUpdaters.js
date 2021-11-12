import { useRef, useEffect } from 'react';

const useUpdaters = (updaters) => {
  const ref = useRef(updaters);

  useEffect(() => {
    return () => {
      ref.current = null;
    };
  }, [ref]);

  return ref;
};

export default useUpdaters;

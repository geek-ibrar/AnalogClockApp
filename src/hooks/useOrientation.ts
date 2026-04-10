import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

const getOrientation = (): Orientation => {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
};

/**
 * Reactively tracks device orientation.
 * Returns 'portrait' or 'landscape', updating whenever the device rotates.
 */
export const useOrientation = (): Orientation => {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () =>
      setOrientation(getOrientation()),
    );
    return () => sub.remove();
  }, []);

  return orientation;
};

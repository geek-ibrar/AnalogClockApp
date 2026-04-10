import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

/** Pre-typed dispatch — use this everywhere instead of raw `useDispatch` */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Pre-typed selector — use this everywhere instead of raw `useSelector` */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);

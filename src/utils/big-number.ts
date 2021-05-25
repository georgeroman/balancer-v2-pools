import { BigNumber } from "bignumber.js";

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: 1,
  DECIMAL_PLACES: 18,
});

export default BigNumber;

export const bn = (value: BigNumber | number | string) => new BigNumber(value);

export const scale = (value: BigNumber, decimalPlaces: number) =>
  value.times(bn(10).pow(decimalPlaces));

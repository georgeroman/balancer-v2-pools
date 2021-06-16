import BigNumber, { bn } from "@utils/big-number";
import * as fp from "@utils/math/fixed-point";

export interface IBasePoolToken {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
}

export interface IBasePoolParams {
  id: string;
  address: string;
  tokens: IBasePoolToken[];
  bptTotalSupply: string;
  swapFeePercentage: string;
  query?: boolean;
}

export default abstract class BasePool {
  private MIN_SWAP_FEE_PERCENTAGE = bn("0.000001"); // 0.0001%
  private MAX_SWAP_FEE_PERCENTAGE = bn("0.1"); // 10%

  protected _id: string;
  protected _address: string;
  protected _bptTotalSupply: string;
  protected _swapFeePercentage: string;
  protected _query = false;

  // ---------------------- Getters ----------------------

  get id() {
    return this._id;
  }

  get address() {
    return this._address;
  }

  get bptTotalSupply() {
    return this._bptTotalSupply;
  }

  get swapFeePercentage() {
    return this._swapFeePercentage;
  }

  get query() {
    return this._query;
  }

  // ---------------------- Constructor ----------------------

  constructor(params: IBasePoolParams) {
    this._id = params.id;
    this._address = params.address;
    this._bptTotalSupply = params.bptTotalSupply;
    this.setSwapFeePercentage(params.swapFeePercentage);

    if (params.query) {
      this._query = params.query;
    }
  }

  // ---------------------- Setters ----------------------

  public setSwapFeePercentage(swapFeePercentage: string) {
    if (bn(swapFeePercentage).lt(this.MIN_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MIN_SWAP_FEE_PERCENTAGE");
    }
    if (bn(swapFeePercentage).gt(this.MAX_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MAX_SWAP_FEE_PERCENTAGE");
    }

    this._swapFeePercentage = swapFeePercentage;
  }

  public setQuery(query: boolean) {
    this._query = query;
  }

  // ---------------------- Internal ----------------------

  protected _addSwapFeePercentage(
    amount: BigNumber,
    swapFeePercentage: BigNumber
  ): BigNumber {
    // This returns amount + fee amount, so we round up (favoring a higher fee amount)
    return fp.divUp(amount, fp.complement(swapFeePercentage));
  }

  protected _subtractSwapFeePercentage(
    amount: BigNumber,
    swapFeePercentage: BigNumber
  ): BigNumber {
    // This returns amount - fee amount, so we round up (favoring a higher fee amount)
    return fp.sub(amount, fp.mulUp(amount, swapFeePercentage));
  }
}

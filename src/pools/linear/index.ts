import BigNumber, { bn } from "../../utils/big-number";
import BasePool, { IBasePoolParams, IBasePoolToken } from "../base";
import * as math from "./math";

export interface ILinearPoolToken extends IBasePoolToken {}

export interface ILinearPoolParams extends IBasePoolParams {
  mainToken: ILinearPoolToken;
  wrappedToken: ILinearPoolToken;
  lowerTarget: string;
  upperTarget: string;
}

export default class LinearPool extends BasePool {
  private MAX_TOKEN_BALANCE = bn(2).pow(112).minus(1);

  private _mainToken: ILinearPoolToken;
  private _wrappedToken: ILinearPoolToken;
  private _bptToken: ILinearPoolToken;
  private _lowerTarget: string;
  private _upperTarget: string;

  // ---------------------- Getters ----------------------

  get tokens() {
    return [this._mainToken, this._wrappedToken, this._bptToken];
  }

  get lowerTarget() {
    return this._lowerTarget;
  }

  get upperTarget() {
    return this._upperTarget;
  }

  // ---------------------- Constructor ----------------------

  constructor(params: ILinearPoolParams) {
    super(params);

    this._mainToken = params.mainToken;
    this._wrappedToken = params.wrappedToken;
    this._bptToken = {
      address: params.address,
      symbol: "BPT",
      balance: "0",
      decimals: 18,
    };

    if (bn(params.lowerTarget).gt(params.upperTarget)) {
      throw new Error("LOWER_GREATER_THAN_UPPER_TARGET");
    }
    if (bn(params.upperTarget).gt(this.MAX_TOKEN_BALANCE)) {
      throw new Error("UPPER_TARGET_TOO_HIGH");
    }

    this._lowerTarget = params.lowerTarget;
    this._upperTarget = params.upperTarget;
  }

  // ---------------------- Swap actions ----------------------

  public swapGivenIn(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string
  ): string {
    const tokenIndexIn = this.tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );
    const tokenIndexOut = this.tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenIn = this.tokens[tokenIndexIn];
    const tokenOut = this.tokens[tokenIndexOut];

    let scaledAmountOut: BigNumber;
    if (tokenIn.symbol === this._bptToken.symbol) {
      if (tokenOut.symbol === this._mainToken.symbol) {
        scaledAmountOut = math._calcMainOutPerBptIn(
          this._upScale(amountIn, tokenIn.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else if (tokenOut.symbol === this._wrappedToken.symbol) {
        scaledAmountOut = math._calcWrappedOutPerBptIn(
          this._upScale(amountIn, tokenIn.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else {
        throw new Error("INVALID_TOKEN");
      }
    } else if (tokenIn.symbol === this._mainToken.symbol) {
      if (tokenOut.symbol === this._wrappedToken.symbol) {
        scaledAmountOut = math._calcWrappedOutPerMainIn(
          this._upScale(amountIn, tokenIn.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else if (tokenOut.symbol === this._bptToken.symbol) {
        scaledAmountOut = math._calcBptOutPerMainIn(
          this._upScale(amountIn, tokenIn.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else {
        throw new Error("INVALID_TOKEN");
      }
    } else if (tokenIn.symbol === this._wrappedToken.symbol) {
      if (tokenOut.symbol === this._mainToken.symbol) {
        scaledAmountOut = math._calcMainOutPerWrappedIn(
          this._upScale(amountIn, tokenIn.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else if (tokenOut.symbol === this._bptToken.symbol) {
        scaledAmountOut = math._calcBptOutPerWrappedIn(
          this._upScale(amountIn, tokenIn.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else {
        throw new Error("INVALID_TOKEN");
      }
    } else {
      throw new Error("INVALID_TOKEN");
    }

    const amountOut = this._downScaleDown(scaledAmountOut, tokenOut.decimals);

    // In-place balance updates
    if (!this._query) {
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
    }

    return amountOut.toString();
  }

  public swapGivenOut(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountOut: string
  ): string {
    const tokenIndexIn = this.tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );
    const tokenIndexOut = this.tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenIn = this.tokens[tokenIndexIn];
    const tokenOut = this.tokens[tokenIndexOut];

    let scaledAmountIn: BigNumber;
    if (tokenOut.symbol === this._bptToken.symbol) {
      if (tokenIn.symbol === this._mainToken.symbol) {
        scaledAmountIn = math._calcMainInPerBptOut(
          this._upScale(amountOut, tokenOut.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else if (tokenIn.symbol === this._wrappedToken.symbol) {
        scaledAmountIn = math._calcWrappedInPerBptOut(
          this._upScale(amountOut, tokenOut.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else {
        throw new Error("INVALID_TOKEN");
      }
    } else if (tokenOut.symbol === this._mainToken.symbol) {
      if (tokenIn.symbol === this._wrappedToken.symbol) {
        scaledAmountIn = math._calcWrappedInPerMainOut(
          this._upScale(amountOut, tokenOut.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else if (tokenIn.symbol === this._bptToken.symbol) {
        scaledAmountIn = math._calcBptInPerMainOut(
          this._upScale(amountOut, tokenOut.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else {
        throw new Error("INVALID_TOKEN");
      }
    } else if (tokenOut.symbol === this._wrappedToken.symbol) {
      if (tokenIn.symbol === this._mainToken.symbol) {
        scaledAmountIn = math._calcMainInPerWrappedOut(
          this._upScale(amountOut, tokenOut.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else if (tokenIn.symbol === this._bptToken.symbol) {
        scaledAmountIn = math._calcBptInPerWrappedOut(
          this._upScale(amountOut, tokenOut.decimals),
          this._upScale(this._mainToken.balance, this._mainToken.decimals),
          this._upScale(
            this._wrappedToken.balance,
            this._wrappedToken.decimals
          ),
          // MAX_TOKEN_BALANCE is always greater than BPT balance
          this.MAX_TOKEN_BALANCE.minus(this._bptToken.balance),
          {
            fee: this._upScale(this._swapFeePercentage, 18),
            lowerTarget: this._upScale(this._lowerTarget, 18),
            upperTarget: this._upScale(this._upperTarget, 18),
          }
        );
      } else {
        throw new Error("INVALID_TOKEN");
      }
    } else {
      throw new Error("INVALID_TOKEN");
    }

    const amountIn = this._downScaleUp(scaledAmountIn, tokenIn.decimals);

    // In-place balance updates
    if (!this._query) {
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
    }

    return amountIn.toString();
  }
}

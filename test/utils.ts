import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import BigNumber from "../src/utils/big-number";

type ContractDeploymentParams = {
  name: string;
  from: SignerWithAddress;
  args?: any[];
};

export const deployContract = async <T extends Contract>(
  params: ContractDeploymentParams
): Promise<T> => {
  const contractFactory = await ethers.getContractFactory(
    params.name,
    params.from
  );
  const contractInstance = await contractFactory.deploy(...(params.args || []));
  return (await contractInstance.deployed()) as T;
};

export const toEvmBn = (value: BigNumber) =>
  ethers.BigNumber.from(value.toString());

export const isSameResult = async (x: Promise<any>, y: Promise<any>) => {
  let xErrored = false;
  let yErrored = false;

  const xResult = await x.catch(() => (xErrored = true));
  const yResult = await y.catch(() => (yErrored = true));

  if (xErrored) {
    return yErrored;
  } else if (yErrored) {
    return xErrored;
  } else {
    // Uncomment to check the actual results:
    // console.log(xResult.toString(), yResult.toString());

    return xResult.toString() === yResult.toString();
  }
};

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import BigNumber from "@utils/big-number";

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

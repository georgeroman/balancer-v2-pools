export const shallowCopy = <T>(obj: T): T => {
  return Object.assign({}, obj);
};

export const shallowCopyAll = <T>(listOfObj: T[]): T[] => {
  return listOfObj.map(shallowCopy);
};

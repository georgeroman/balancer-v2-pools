export const shallowCopy = <T>(obj: T): T => {
  return Object.assign({}, obj);
};

export const shallowCopyAll = <T>(objs: T[]): T[] => {
  return objs.map(shallowCopy);
};

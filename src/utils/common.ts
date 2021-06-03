export const shallowCopy = <T>(obj: T): T => {
  return Object.assign({}, obj);
};

export const shallowCopyAll = <T>(objs: T[]): T[] => {
  return objs.map(shallowCopy);
};

export const mapsToOrderedLists = <T>(
  ...maps: { [key: string]: T }[]
): T[][] => {
  if (maps.length === 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < maps.length; i++) {
    result.push([]);
  }

  for (const key of Object.keys(maps[0])) {
    for (let i = 0; i < maps.length; i++) {
      result[i].push(maps[i][key]);
    }
  }

  return result;
};

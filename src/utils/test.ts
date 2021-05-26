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
    return xResult.toString() === yResult.toString();
  }
};

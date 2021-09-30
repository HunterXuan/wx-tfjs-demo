export const lipsLowerInner = [
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308
];

export const lipsLowerOuter = [
  146, 91, 181, 84, 17, 314, 405, 321, 375, 291
];

export const lipsUpperInner = [
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308
];

export const lipsUpperOuter = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291
];

export const lipsLowerPointSeries = [
  ...lipsLowerOuter,
  ...lipsLowerInner.reverse()
];

export const lipsUpperPointSeries = [
  ...lipsUpperOuter,
  ...lipsUpperInner.reverse()
];
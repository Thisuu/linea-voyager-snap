export const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}••••${address.slice(
    address.length - 4,
    address.length,
  )}`;

export const stringToHex = (input: string): string => {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    result += input.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return result;
};

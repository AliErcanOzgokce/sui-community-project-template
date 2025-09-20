export interface AddressValidationResult {
  isValid: boolean;
  error: string;
}

export const validateSuiAddress = (
  address: string,
): AddressValidationResult => {
  if (!address.trim()) {
    return {
      isValid: false,
      error: "Please enter an address",
    };
  }
  
  const addressRegex = /^0x[a-fA-F0-9]{64}$/;

  if (!addressRegex.test(address)) {
    return {
      isValid: false,
      error: "Please enter a valid Sui address (0x...)",
    };
  }

  return {
    isValid: true,
    error: "",
  };
};

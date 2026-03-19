let confirmationResult = null;

export const setConfirmation = (c) => {
  confirmationResult = c;
};

export const getConfirmation = () => confirmationResult;

export const clearConfirmation = () => {
  confirmationResult = null;
};
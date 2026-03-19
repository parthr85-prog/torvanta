import { useState } from "react";

let _setRegistering = null;

export const useRegisteringState = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  _setRegistering = setIsRegistering;

  return { isRegistering };
};

export const setRegistering = (value) => {
  if (_setRegistering) {
    _setRegistering(value);
  } else {
    console.log("setRegistering called before initialization");
  }
};

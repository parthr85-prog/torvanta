import AsyncStorage from "@react-native-async-storage/async-storage";

export const setOtpVerified = async () => {
  await AsyncStorage.setItem("otp_verified", "true");
};

export const clearOtpVerified = async () => {
  await AsyncStorage.removeItem("otp_verified");
};

export const isOtpVerified = async () => {
  const value = await AsyncStorage.getItem("otp_verified");
  return value === "true";
};

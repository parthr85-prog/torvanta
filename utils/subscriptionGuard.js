import { Alert } from "react-native";

/**
 * Blocks access if subscription is expired
 */
export const requireActiveSubscription = (user) => {
  if (!user?.subscription?.expiresAt) {
    Alert.alert("Subscription Required", "Please purchase a subscription.");
    return false;
  }

  const expiry =
    user.subscription.expiresAt.toDate?.() ||
    new Date(user.subscription.expiresAt);

  if (new Date() > expiry) {
    Alert.alert(
      "Subscription Expired",
      "Your subscription has expired. Please renew."
    );
    return false;
  }

  return true;
};

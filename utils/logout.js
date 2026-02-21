import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const logout = async () => {
  await signOut(auth);
};

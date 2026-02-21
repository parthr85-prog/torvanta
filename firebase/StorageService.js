import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "../firebaseConfig";

const storage = getStorage(app);

export const uploadFile = async (uri, path) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef);
};

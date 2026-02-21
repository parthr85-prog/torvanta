import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../../firebaseConfig";


import NotificationScreen from "../screens/common/NotificationsScreen";
import ViewUserProfile from "../screens/common/view-user-profile";
import CompanyDrawer from "../screens/company/CompanyDrawer";
import ViewListing from "../screens/company/view-listing";
import ViewMyListing from "../screens/company/view-my-listing";
import ContractorDrawer from "../screens/contractor/ContractorDrawer";
import LabourDrawer from "../screens/labour/LabourDrawer";
import AuthStack from "./AuthStack";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH + ROLE LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          setRole(snap.data().role);
        } else {
          setRole(null);
        }
      } catch (e) {
        console.log("ROLE FETCH ERROR:", e);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ⏳ WAIT UNTIL READY
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 🔴 NOT LOGGED IN */}
      {!user && (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}

      {/* 🟢 LOGGED IN + ROLE */}
      {user && role === "company" && (
        <Stack.Screen name="Company" component={CompanyDrawer} />
      )}

      {user && role === "contractor" && (
        <Stack.Screen name="Contractor" component={ContractorDrawer} />
      )}

      {user && role === "labour" && (
        <Stack.Screen name="Labour" component={LabourDrawer} />
      )}

      {/* 🟡 LOGGED IN BUT ROLE MISSING → AUTH */}
      {user && !role && (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
     <Stack.Screen name="ViewMyListing" component={ViewMyListing} />

<Stack.Screen name="ViewListing" component={ViewListing} />
  <Stack.Screen name="ViewUserProfile" component={ViewUserProfile} />
    <Stack.Screen name="NotificationScreen" component={NotificationScreen} />


    </Stack.Navigator>
  );
}

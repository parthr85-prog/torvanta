import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../../firebaseConfig";


export default function DashboardHeader({ title }) {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [unreadCount, setUnreadCount] = useState(0);
 


  const handleLogout = async () => {
    await signOut(auth);


   
    // ❗ Do NOT navigate here
    // Root layout will redirect automatically
  };


useEffect(() => {
  if (!user) return;

  const q = query(
    collection(db, "users", user.uid, "notifications"),
    where("isRead", "==", false)
  );

  const unsub = onSnapshot(q, (snap) => {
    setUnreadCount(snap.size);
  });

  return unsub;
}, []);
const openDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };
  return (
    
    <View style={styles.header}>
      {/* ☰ MENU */}
      <TouchableOpacity onPress={openDrawer}>
        <Ionicons name="menu" size={26} color="#111" />
      </TouchableOpacity>
      
      {/* WELCOME */}
      <Text style={styles.title} numberOfLines={2} >
        {title}
      </Text>

      {/* 🔓 LOGOUT ICON */}
      <TouchableOpacity onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={26} color="#dc2626" />
      </TouchableOpacity>
   

    
        {/* 🔔 NOTIFICATIONS */}
     

<View>
  <TouchableOpacity onPress={() => navigation.navigate("NotificationScreen")}>
    <Ionicons name="notifications-outline" size={24} color="#000" />
  </TouchableOpacity>

  {unreadCount > 0 && (
    <View style={{
      position: "absolute",
      right: -6,
      top: -6,
      backgroundColor: "red",
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    }}>
      <Text style={{ color: "#fff", fontSize: 10 }}>
        {unreadCount}
      </Text>
    </View>
  )}
</View>
</View>
);
}

const styles = StyleSheet.create({
  header: {
    height: 78,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f5f7f8",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    maxWidth: "75%",
    color: "#193fd5"
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
});

import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DashboardHeader({ title }) {
  const navigation = useNavigation();
  const user = auth().currentUser;
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
  await auth().signOut();
};

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("isRead", "==", false)
      .onSnapshot((snap) => {
        setUnreadCount(snap.size);
      });

    return () => unsubscribe();
  }, []);

  const openDrawer = () => {
  navigation.dispatch(DrawerActions.toggleDrawer());

  
};

const contactSupport = () => {
  Linking.openURL(
    "mailto:info@torvanta.in?subject=Torvanta Support Request&body=User ID: "+user?.uid
  );
}
  return (
    <View style={styles.header}>
      {/* LEFT */}
      <TouchableOpacity onPress={openDrawer}>
        <Ionicons name="menu" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* CENTER TITLE */}
      <View style={styles.titleContainer}>
       <Text style={styles.title}>{title}
        </Text>
      </View>

      
      {/* Assistance */}

<TouchableOpacity
  style={styles.helpContainer}
  onPress={contactSupport}
>

<Ionicons
  name="mail-outline"
  size={16}
  color="#D4AF37"
/>

<Text style={styles.helpText}>
  For assistance: info@torvanta.in
</Text>

</TouchableOpacity>
      

      {/* RIGHT ICONS */}
      <View style={styles.iconGroup}>
        <View style={{ marginRight: 18 }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("NotificationScreen")
            }
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#D4AF37"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 95,
    paddingTop: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#0B1F3B",
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A63",
  },

  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#D4AF37",
    textAlign: "center",
    lineHeight: 22,
  },

  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#D4AF37",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#0B1F3B",
    fontSize: 10,
    fontWeight: "700",
  },

  helpContainer:{
position:"absolute",
bottom:6,
alignSelf:"center",
flexDirection:"row",
alignItems:"center"
},

helpText:{
color:"#C7D2E2",
fontSize:12,
marginRight:6,
},
});
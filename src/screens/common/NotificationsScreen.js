import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const navigation = useNavigation();

  /* ---------------- REAL-TIME LISTENER ---------------- */
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .onSnapshot(async (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setNotifications(list);

        /* ✅ MARK ALL UNREAD AS READ WHEN SCREEN OPENS */
        const unreadDocs = snapshot.docs.filter(
          (doc) => !doc.data().isRead
        );

        if (unreadDocs.length > 0) {
          const batch = firestore().batch();

          unreadDocs.forEach((doc) => {
            batch.update(doc.ref, { isRead: true });
          });

          await batch.commit();
        }
      });

    return () => unsubscribe();
  }, []);

  /* ---------------- OPEN NOTIFICATION ---------------- */
  const openNotification = async (item) => {
  try {

    const user = auth().currentUser;
    if (!user) return;

    /* mark as read */
    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .doc(item.id)
      .update({ isRead: true });

    /* ---------- NAVIGATION LOGIC ---------- */

    if (item.type === "NEW_BID") {
      navigation.navigate("ViewMyListing", {
        listingId: item.listingId || item.relatedListingId,
      });
      return;
    }

    if (item.type === "BID_REJECTED") {
      navigation.navigate("MyBids");
      return;
    }

    if (item.type === "BID_AWARDED") {
      navigation.navigate("ViewListing", {
        listingId: item.listingId || item.relatedListingId,
      });
      return;
    }

    if (item.type === "RATE_LISTING_CREATOR") {
      navigation.navigate("RateUser", {
        listingId: item.listingId,
        userId: item.userId,
      });
      return;
    }

    /* fallback */
    console.log("Unknown notification type:", item.type);

  } catch (e) {
    console.log("NOTIFICATION OPEN ERROR:", e);
  }
};

  /* ---------------- DELETE ---------------- */
  const deleteNotification = async (id) => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      await firestore()
        .collection("users")
        .doc(user.uid)
        .collection("notifications")
        .doc(id)
        .delete();
    } catch (e) {
      console.log("DELETE ERROR:", e);
    }
  };

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity
        style={[
          styles.card,
          item.isRead ? styles.readCard : styles.unreadCard,
        ]}
        onPress={() => openNotification(item)}
      >
        <Text
          style={[
            styles.title,
            { fontWeight: item.isRead ? "500" : "700" },
          ]}
        >
          {item.title}
        </Text>

        <Text style={styles.msg}>{item.message}</Text>

        {item.createdAt && (
          <Text style={styles.date}>
            {item.createdAt.toDate().toLocaleString()}
          </Text>
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {notifications.length === 0 ? (
        <Text style={styles.emptyText}>
          No notifications yet
        </Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* ---------------- TORVANTA THEME ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0B1F3B",
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#94A3B8",
  },

  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
  },

  unreadCard: {
    backgroundColor: "#122A4D",
    borderColor: "#D4AF37",
  },

  readCard: {
    backgroundColor: "#122A4D",
    borderColor: "#1E3A63",
  },

  title: {
    fontSize: 16,
    color: "#FFFFFF",
  },

  msg: {
    fontSize: 14,
    marginTop: 6,
    color: "#E5E7EB",
  },

  date: {
    fontSize: 12,
    marginTop: 8,
    color: "#94A3B8",
  },

  deleteButton: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    marginBottom: 14,
    borderRadius: 16,
  },

  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
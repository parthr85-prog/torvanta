import { useNavigation } from "@react-navigation/native";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { auth, db } from "../../../firebaseConfig";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const navigation = useNavigation();

  /* ---------------- REAL-TIME LISTENER ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return unsubscribe;
  }, []);

  /* ---------------- OPEN NOTIFICATION ---------------- */
  const openNotification = async (item) => {
    try {
      // Mark as read
      await updateDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "notifications",
          item.id
        ),
        { isRead: true }
      );

      // Navigate based on type
      if (
        item.type === "NEW_BID" ||
        item.type === "BID_REJECTED"
      ) {
        navigation.navigate("ViewMyListing", {
          listingId: item.relatedListingId,
        });
      }

      if (item.type === "BID_AWARDED") {
        navigation.navigate("ViewListing", {
          listingId: item.relatedListingId,
        });
      }

    } catch (e) {
      console.log("NOTIFICATION OPEN ERROR:", e);
    }
  };

  /* ---------------- DELETE NOTIFICATION ---------------- */
  const deleteNotification = async (id) => {
    try {
      await deleteDoc(
        doc(db, "users", auth.currentUser.uid, "notifications", id)
      );
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
          { backgroundColor: item.isRead ? "#fff" : "#e8f0ff" },
        ]}
        onPress={() => openNotification(item)}
      >
        <Text
          style={[
            styles.title,
            { fontWeight: item.isRead ? "normal" : "bold" },
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
        <Text style={{ textAlign: "center", marginTop: 30 }}>
          No notifications yet
        </Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f6fa",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
  },
  msg: {
    fontSize: 14,
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    marginTop: 6,
    color: "#6b7280",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 10,
    borderRadius: 10,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RateUser() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, listingId } = route.params;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    if (rating === 0) {
      return Alert.alert("Please select rating");
    }

    try {
      setLoading(true);

      const userRef = firestore().collection("users").doc(userId);
      const listingRef = firestore().collection("listings").doc(listingId);

      await firestore().runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
          throw new Error("User not found");
        }

        const userData = userSnap.data();

        const previousTotal = userData.totalRatings || 0;
        const previousAvg = userData.averageRating || 0;

        const newTotal = previousTotal + 1;
        const newAverage =
          (previousAvg * previousTotal + rating) / newTotal;

        // 1️⃣ Save rating document
        const ratingRef = userRef.collection("ratings").doc();

        transaction.set(ratingRef, {
          rating,
          review,
          listingId,
          ratedAt: firestore.FieldValue.serverTimestamp(),
        });

        // 2️⃣ Update user stats
        transaction.update(userRef, {
          totalRatings: newTotal,
          averageRating: Number(newAverage.toFixed(2)),
        });

        // 3️⃣ Mark listing rated
        transaction.update(listingRef, {
          rated: true,
        });
      });

      Alert.alert("Thank you!", "Rating submitted successfully");

      navigation.popToTop();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
          >
            <Text style={styles.star}>
              {star <= rating ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate Contractor</Text>

      {renderStars()}

      <TextInput
        style={styles.input}
        placeholder="Write a review (optional)"
        placeholderTextColor="#9CA3AF"
        multiline
        value={review}
        onChangeText={setReview}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={submitRating}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Submitting..." : "Submit Rating"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1F3B",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  star: {
    fontSize: 36,
    marginRight: 10,
    color: "#D4AF37",
  },
  input: {
    backgroundColor: "#122A4D",
    borderWidth: 1,
    borderColor: "#1E3A63",
    borderRadius: 14,
    padding: 14,
    color: "#FFFFFF",
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 14,
  },
  buttonText: {
    color: "#0B1F3B",
    fontWeight: "700",
    textAlign: "center",
  },
});
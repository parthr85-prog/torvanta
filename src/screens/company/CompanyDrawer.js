// src/screens/company/CompanyDrawer.js

import { Ionicons } from "@expo/vector-icons";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Image, StyleSheet, Text, View } from "react-native";
import MyBids from "../../screens/company/my-bids";
import MyDownloads from "../common/MyDownloads";
import CreateListing from "./create-listing";
import CompanyDashboard from "./dashboard";
import MyListings from "./my-listings";
import CompanyProfile from "./profile";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B1F3B" }}>
      <View style={styles.headerContainer}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>TORVANTA</Text>
      </View>

      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

export default function CompanyDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "#0B1F3B",
          width: 260,
        },
        drawerActiveTintColor: "#D4AF37",
        drawerInactiveTintColor: "#C7D2E2",
        drawerActiveBackgroundColor: "#1E3A63",
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 10,
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={CompanyDashboard}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={CompanyProfile}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Create Listing"
        component={CreateListing}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="My Listings"
        component={MyListings}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="My Bids"
        component={MyBids}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="My Downloads"
        component={MyDownloads}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 40,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A63",
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
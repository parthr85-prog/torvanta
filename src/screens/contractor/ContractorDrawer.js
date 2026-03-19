import { createDrawerNavigator } from "@react-navigation/drawer";
import CreateListing from "../../screens/contractor/create-listing";
import Dashboard from "../../screens/contractor/dashboard";
import MyBids from "../../screens/contractor/my-bids";
import MyListings from "../../screens/contractor/my-listings";
import MyDownloads from "../common/MyDownloads";
import Profile from "./profile";

const Drawer = createDrawerNavigator();

export default function ContractorDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,

        drawerStyle: {
          backgroundColor: "#0B1F3B", // Torvanta Navy
        },

        drawerActiveBackgroundColor: "#D4AF37", // Gold highlight
        drawerActiveTintColor: "#0B1F3B", // Navy text on gold
        drawerInactiveTintColor: "#FFFFFF", // White text
        drawerLabelStyle: {
          fontWeight: "600",
          fontSize: 15,
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="Create Listing" component={CreateListing} />
      <Drawer.Screen name="My Listings" component={MyListings} />
      <Drawer.Screen name="My Bids" component={MyBids} />
      <Drawer.Screen name="My Downloads" component={MyDownloads} />
    </Drawer.Navigator>
  );
}
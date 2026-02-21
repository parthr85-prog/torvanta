import { createDrawerNavigator } from "@react-navigation/drawer";
import EditProfile from "../../screens/common/edit-profile";
import CreateListing from "../../screens/contractor/create-listing";
import Dashboard from "../../screens/contractor/dashboard";
import MyBids from "../../screens/contractor/my-bids";
import MyListings from "../../screens/contractor/my-listings";
import Profile from "./profile";

const Drawer = createDrawerNavigator();

export default function ContractorDrawer() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="Create Listing" component={CreateListing} />
      <Drawer.Screen name="My Listings" component={MyListings} />
      <Drawer.Screen name="My Bids" component={MyBids} />
      <Drawer.Screen name="EditProfile" component={EditProfile} />

    </Drawer.Navigator>
  );
}

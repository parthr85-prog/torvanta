// src/screens/company/CompanyDrawer.js
import { createDrawerNavigator } from "@react-navigation/drawer";
import EditProfile from "../../screens/common/edit-profile";
import CreateListing from "./create-listing";
import CompanyDashboard from "./dashboard";
import MyBids from "./my-bids";
import MyListings from "./my-listings";
import CompanyProfile from "./profile";
const Drawer = createDrawerNavigator();

export default function CompanyDrawer() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Dashboard" component={CompanyDashboard} />
      <Drawer.Screen name="Profile" component={CompanyProfile} />
      <Drawer.Screen name="Create Listing" component={CreateListing} />
      <Drawer.Screen name="My Listings" component={MyListings} />
      <Drawer.Screen name="My Bids" component={MyBids} />
      <Drawer.Screen name="EditProfile" component={EditProfile} />

    </Drawer.Navigator>
  );
}

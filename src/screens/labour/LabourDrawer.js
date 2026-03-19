import { createDrawerNavigator } from "@react-navigation/drawer";
import Dashboard from "../../screens/labour/dashboard";
import MyBids from "../../screens/labour/my-bids";
import Profile from "../../screens/labour/profile";
import MyDownloads from "../common/MyDownloads";

const Drawer = createDrawerNavigator();

export default function LabourDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,

        drawerStyle: {
          backgroundColor: "#0B1F3B", // Torvanta Navy
        },

        drawerActiveBackgroundColor: "#D4AF37", // Gold
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
      <Drawer.Screen name="My Bids" component={MyBids} />
      <Drawer.Screen name="My Downloads" component={MyDownloads} />
    </Drawer.Navigator>
  );
}
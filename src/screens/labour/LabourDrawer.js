import { createDrawerNavigator } from "@react-navigation/drawer";
import EditProfile from "../../screens/common/edit-profile";
import Dashboard from "../../screens/labour/dashboard";
import MyBids from "../../screens/labour/my-bids";
import Profile from "../../screens/labour/profile";
const Drawer = createDrawerNavigator();

export default function LabourDrawer() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="My Bids" component={MyBids} />
      <Drawer.Screen name="EditProfile" component={EditProfile} />

    </Drawer.Navigator>
  );
}

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../screens/auth/login";
import RegisterCompany from "../screens/auth/register-company";
import RegisterContractor from "../screens/auth/register-contractor";
import RegisterLabour from "../screens/auth/register-labour";
import RegisterPhone from "../screens/auth/register-phone";
import RegisterRole from "../screens/auth/register-role";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="RegisterRole" component={RegisterRole} />
      <Stack.Screen name="RegisterPhone" component={RegisterPhone} />
      <Stack.Screen name="RegisterCompany" component={RegisterCompany} />
      <Stack.Screen name="RegisterContractor" component={RegisterContractor} />
      <Stack.Screen name="RegisterLabour" component={RegisterLabour} />
    </Stack.Navigator>
  );
}

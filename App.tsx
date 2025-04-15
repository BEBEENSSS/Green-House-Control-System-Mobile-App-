import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import { RootStackParamList } from './src/types/navigation';
import TemperatureScreen from './src/screens/TemperatureScreen';
import WaterLevelScreen from './src/screens/WaterLevelScreen';
import LightExposedScreen from './src/screens/LightExposedScreen';

const Stack = createNativeStackNavigator<
  RootStackParamList,
  string
>();

export default function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator id="HomeStack" initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Temperature" component={TemperatureScreen} options={{ title: 'Room Temperature' }}/>
      <Stack.Screen name="WaterLevel" component={WaterLevelScreen} options={{ title: 'Water Level' }}/>
      <Stack.Screen name="LightExposed" component={LightExposedScreen} options={{ title: 'Light Exposed' }}/>
    </Stack.Navigator>

    </NavigationContainer>
  );
}

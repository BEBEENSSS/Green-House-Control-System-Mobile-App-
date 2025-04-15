import React, { useRef } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './src/styles/AppStyles';
import AnimatedCircleProgress from './src/components/AnimatedCircleProgress';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types/navigation';
import { useSharedData } from './src/data/Esp32Data';


export default function HomeScreen() {
  const tempScale = useRef(new Animated.Value(1)).current;
  const waterScale = useRef(new Animated.Value(1)).current;
  const lightScale = useRef(new Animated.Value(1)).current;

  const [pressedBox, setPressedBox] = React.useState(null);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { tempValue, waterValue, lightValue } = useSharedData();

  const handlePressIn = (scale, boxName) => {
    setPressedBox(boxName);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = (scale) => {
    setPressedBox(null);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Bens App</Text>
        <TouchableOpacity style={styles.iconContainer}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mainContainer}>
        <View style={styles.row}>
          {/* Temperature Box */}
          <View style={styles.opacityBox}>
            <TouchableWithoutFeedback
              onPressIn={() => handlePressIn(tempScale, 'temp')}
              onPressOut={() => handlePressOut(tempScale)}
              onPress={() => navigation.navigate('Temperature', { id: 'Idtemp' })}

            >
              <Animated.View style={[
                styles.box,
                {
                  transform: [{ scale: tempScale }],
                  backgroundColor: pressedBox === 'temp' ? '#E8E6E6' : '#fefeff',
                }
              ]}>
                <View style={styles.boxContent}>
                  <AnimatedCircleProgress value={tempValue} unit="°C" colorScheme="temp" />
                </View>
                <Text style={styles.boxText}>Room Temperature</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>


          
          <View style={styles.gap} />
          
          {/* Water Level Box */}
          <View style={styles.opacityBox}>
          <TouchableWithoutFeedback
            onPressIn={() => handlePressIn(waterScale, 'water')}
            onPressOut={() => handlePressOut(waterScale)}
            onPress={() => navigation.navigate('WaterLevel', { id: 'Idwater' })}
          >
            <Animated.View style={[
              styles.box,
              {
                transform: [{ scale: waterScale }],
                backgroundColor: pressedBox === 'water' ? '#E8E6E6' : '#fefeff',
              }
            ]}>
              <View style={styles.boxContent}>
                <AnimatedCircleProgress value={waterValue} unit="%" colorScheme="water" />
              </View>
              <Text style={styles.boxText}>Water Level</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>

        </View>
        
        <View style={styles.rowGap} />
        
        <View style={styles.row}>
          {/* Grow Light Box */}
          <View style={styles.opacityBox}>
          <TouchableWithoutFeedback
            onPressIn={() => handlePressIn(lightScale, 'light')}
            onPressOut={() => handlePressOut(lightScale)}
            onPress={() => navigation.navigate('LightExposed', { id: 'Idlight' })}
          >
            <Animated.View style={[
              styles.box,
              {
                transform: [{ scale: lightScale }],
                backgroundColor: pressedBox === 'light' ? '#E8E6E6' : '#fefeff',
              }
            ]}>
              <View style={styles.boxContent}>
                <AnimatedCircleProgress value={lightValue} unit="%" colorScheme="light" />
              </View>
              <Text style={styles.boxText}>Light Exposed</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
          <View style={styles.gap} />
        </View>
      </View>
    </SafeAreaView>
  );
}

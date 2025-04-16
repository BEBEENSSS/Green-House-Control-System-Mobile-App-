import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { styles } from '../styles/ScreenStyles';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Esp32DataContext } from '../data/Esp32Data';
import { getDatabase, ref, set, onValue } from 'firebase/database';

type TemperatureRouteProp = RouteProp<RootStackParamList, 'Temperature'>;

const TemperatureScreen = () => {
  const route = useRoute<TemperatureRouteProp>();
  const { id } = route.params;

  const [isExhaustFanEnabled, setIsExhaustFanEnabled] = useState<boolean | null>(null);
  const [isAutomatic, setIsAutomatic] = useState<boolean | null>(null);
  const [fanTemp, setFanTemp] = useState('N/A');
  const [confirmedFanTemp, setConfirmedFanTemp] = useState('N/A');
  const [isEditing, setIsEditing] = useState(false);
  const [screenReady, setScreenReady] = useState(false);

  const { tempValue } = useContext(Esp32DataContext);

  useEffect(() => {
    const db = getDatabase();

    const autoRef = ref(db, 'automaticMode/automaticTemp');
    const fanRef = ref(db, 'actuators/exhaustFanStatus');

    let autoLoaded = false;
    let fanLoaded = false;

    const checkReady = () => {
      if (autoLoaded && fanLoaded) {
        setScreenReady(true);
      }
    };

    const unsubscribeAuto = onValue(autoRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsAutomatic(snapshot.val());
      }
      autoLoaded = true;
      checkReady();
    });

    const unsubscribeFan = onValue(fanRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsExhaustFanEnabled(snapshot.val());
      }
      fanLoaded = true;
      checkReady();
    });

    return () => {
      unsubscribeAuto();
      unsubscribeFan();
    };
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const fanTempRef = ref(db, 'roomTemp/fanTemp');
  
    const unsubscribeFanTemp = onValue(fanTempRef, (snapshot) => {
      if (snapshot.exists()) {
        const value = snapshot.val().toString();
        setFanTemp(value);
        setConfirmedFanTemp(value);
      }
    });
  
    return () => {
      unsubscribeFanTemp();
    };
  }, []);
  

  // 🔁 Apply automatic fan control based on temperature
  useEffect(() => {
    if (isAutomatic && tempValue !== null) {
      const threshold = parseFloat(confirmedFanTemp);
      if (!isNaN(threshold)) {
        const shouldEnableFan = tempValue >= threshold;
        setIsExhaustFanEnabled((prev) => {
          if (prev !== shouldEnableFan) {
            updateFanStatusInFirebase(shouldEnableFan);
          }
          return shouldEnableFan;
        });
      }
    }
  }, [tempValue, confirmedFanTemp, isAutomatic]);

  const toggleExhaustFan = () => {
    setIsAutomatic(false);
    const db = getDatabase();
    const autoRef = ref(db, 'automaticMode/automaticTemp');
    set(autoRef, false);

    setIsExhaustFanEnabled((prev) => {
      const newStatus = !prev;
      updateFanStatusInFirebase(newStatus);
      return newStatus;
    });
  };

  const toggleAutomatic = () => {
    setIsAutomatic((prev) => {
      const newStatus = !prev;
      const db = getDatabase();
      const autoRef = ref(db, 'automaticMode/automaticTemp');
      set(autoRef, newStatus);
      return newStatus;
    });
  };

  const getTempColor = (temp: number) => {
    if (temp >= 40) return '#FF4500';
    if (temp >= 30) return '#FFD700';
    if (temp >= 20) return '#00C851';
    return '#1E90FF';
  };

  const updateFanStatusInFirebase = (status: boolean) => {
    const db = getDatabase();
    const fanRef = ref(db, 'actuators/exhaustFanStatus');
    set(fanRef, status);
  };

  const saveFanTempToFirebase = (temp: string) => {
    const db = getDatabase();
    const fanTempRef = ref(db, 'roomTemp/fanTemp');
    set(fanTempRef, Number(temp));
  };
  

  // 🚫 Wait for data to be ready
  if (!screenReady) return null;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <AnimatedCircleProgress
          value={tempValue !== null ? tempValue : 0}
          unit="°C"
          colorScheme="temp"
          size={200}
          strokeWidth={12}
          fontSize={32}
          fontColor="#2c3e50"
        />
      </View>

      <View style={styles.containerOption}>
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Exhaust Fan</Text>
          <CustomToggle value={isExhaustFanEnabled!} onValueChange={toggleExhaustFan} />
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Automatic</Text>
          <CustomToggle value={isAutomatic!} onValueChange={toggleAutomatic} />
        </View>

        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Fan turn on at </Text>
            <Pressable onPress={() => {
              setFanTemp(confirmedFanTemp);
              setIsEditing(true);
            }}>
              <Icon name="edit" size={20} color="#333" />
            </Pressable>
          </View>

          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.texttemp, { color: getTempColor(Number(fanTemp)), marginRight: 4 }]}
                value={fanTemp}
                onChangeText={setFanTemp}
                keyboardType="numeric"
                autoFocus
                onSubmitEditing={() => {
                  setConfirmedFanTemp(fanTemp);
                  setIsEditing(false);
                  saveFanTempToFirebase(fanTemp); // 🔥 Save to Firebase
                }}
                onBlur={() => {
                  setFanTemp(confirmedFanTemp);
                  setIsEditing(false);
                }}                
              />
              <Text style={[styles.texttemp, { color: getTempColor(Number(fanTemp)) }]}>°C</Text>
            </View>
          ) : (
            <Text style={[styles.texttemp, { color: getTempColor(Number(confirmedFanTemp)) }]}>
              {confirmedFanTemp}°C
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default TemperatureScreen;

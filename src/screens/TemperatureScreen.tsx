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
  // Navigation and context
  const route = useRoute<TemperatureRouteProp>();
  const { id } = route.params;
  const { tempValue } = useContext(Esp32DataContext);

  // Component state
  const [isExhaustFanEnabled, setIsExhaustFanEnabled] = useState<boolean | null>(null);
  const [isAutomatic, setIsAutomatic] = useState<boolean | null>(null);
  const [fanTemp, setFanTemp] = useState('N/A');
  const [confirmedFanTemp, setConfirmedFanTemp] = useState('N/A');
  const [isEditing, setIsEditing] = useState(false);
  const [screenReady, setScreenReady] = useState(false);

  // Firebase data loading
  useEffect(() => {
    const db = getDatabase();
    const autoRef = ref(db, 'automaticMode/automaticTemp');
    const fanRef = ref(db, 'actuators/exhaustFanStatus');
    const fanTempRef = ref(db, 'roomTemp/fanTemp');

    let autoLoaded = false;
    let fanLoaded = false;

    const checkReady = () => {
      if (autoLoaded && fanLoaded) {
        setScreenReady(true);
      }
    };

    // Subscribe to automatic mode changes
    const unsubscribeAuto = onValue(autoRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsAutomatic(snapshot.val());
      }
      autoLoaded = true;
      checkReady();
    });

    // Subscribe to fan status changes
    const unsubscribeFan = onValue(fanRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsExhaustFanEnabled(snapshot.val());
      }
      fanLoaded = true;
      checkReady();
    });

    // Subscribe to fan temperature threshold
    const unsubscribeFanTemp = onValue(fanTempRef, (snapshot) => {
      if (snapshot.exists()) {
        const value = snapshot.val().toString();
        setFanTemp(value);
        setConfirmedFanTemp(value);
      }
    });

    return () => {
      unsubscribeAuto();
      unsubscribeFan();
      unsubscribeFanTemp();
    };
  }, []);

  // Automatic fan control logic
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

  // Helper functions
  const getTempColor = (temp: number) => {
    if (temp >= 40) return '#FF4500';  // Red
    if (temp >= 30) return '#FFD700';   // Yellow
    if (temp >= 20) return '#00C851';   // Green
    return '#1E90FF';                   // Blue
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

  // Event handlers
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

  const handleTempSubmit = () => {
    setConfirmedFanTemp(fanTemp);
    setIsEditing(false);
    saveFanTempToFirebase(fanTemp);
  };

  const handleTempEditCancel = () => {
    setFanTemp(confirmedFanTemp);
    setIsEditing(false);
  };

  // Render loading state if data isn't ready
  if (!screenReady) return null;

  return (
    <View style={styles.container}>
      {/* Temperature display */}
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

      {/* Controls section */}
      <View style={styles.containerOption}>
        {/* Exhaust Fan Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Exhaust Fan {isExhaustFanEnabled ? '(ON)' : '(OFF)'}</Text>
          <CustomToggle value={isExhaustFanEnabled!} onValueChange={toggleExhaustFan} />
        </View>

        {/* Automatic Mode Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Automatic Mode</Text>
          <CustomToggle value={isAutomatic!} onValueChange={toggleAutomatic} />
        </View>

        {/* Temperature Threshold Setting */}
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Turn On Fan At </Text>
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
                style={[styles.texttemp, { 
                  color: getTempColor(Number(fanTemp)), 
                  marginRight: 4 
                }]}
                value={fanTemp}
                onChangeText={setFanTemp}
                keyboardType="numeric"
                autoFocus
                onSubmitEditing={handleTempSubmit}
                onBlur={handleTempEditCancel}                
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
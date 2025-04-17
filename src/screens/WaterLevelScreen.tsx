import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { styles } from '../styles/ScreenStyles';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Esp32DataContext } from '../data/Esp32Data';
import { getDatabase, ref, set, onValue } from 'firebase/database';

type WaterLevelRouteProp = RouteProp<RootStackParamList, 'WaterLevel'>;

const WaterLevelScreen = () => {
  // Navigation and context
  const route = useRoute<WaterLevelRouteProp>();
  const { id } = route.params;
  const { soilMoistureValue } = useContext(Esp32DataContext);

  // Component state
  const [isWaterPumpEnabled, setIsWaterPumpEnabled] = useState<boolean | null>(null);
  const [isAWSEnabled, setIsAWSEnabled] = useState(false);
  const [screenReady, setScreenReady] = useState(false);

  // Watering schedule state
  const [startTime, setStartTime] = useState('6:00 AM');
  const [endTime, setEndTime] = useState('7:00 AM');
  const [confirmedStartTime, setConfirmedStartTime] = useState('6:00 AM');
  const [confirmedEndTime, setConfirmedEndTime] = useState('7:00 AM');
  const [editingStep, setEditingStep] = useState<'start' | 'end' | null>(null);

  // Refs
  const endTimeInputRef = useRef<TextInput>(null);

  // Firebase data loading
  useEffect(() => {
    const db = getDatabase();
    const waterPumpRef = ref(db, 'actuators/waterPumpStatus');
    const awsRef = ref(db, 'automaticMode/awsStatus');

    let waterPumpLoaded = false;
    let awsLoaded = false;

    const checkReady = () => {
      if (waterPumpLoaded && awsLoaded) {
        setScreenReady(true);
      }
    };

    const unsubscribeWaterPump = onValue(waterPumpRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsWaterPumpEnabled(snapshot.val());
      }
      waterPumpLoaded = true;
      checkReady();
    });

    const unsubscribeAWS = onValue(awsRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsAWSEnabled(snapshot.val());
      }
      awsLoaded = true;
      checkReady();
    });

    return () => {
      unsubscribeWaterPump();
      unsubscribeAWS();
    };
  }, []);

  // Automatic pump control when moisture reaches 100%
  useEffect(() => {
    if (soilMoistureValue >= 100 && isWaterPumpEnabled) {
      updateWaterPumpStatusInFirebase(false);
      setIsWaterPumpEnabled(false);
    }
  }, [soilMoistureValue, isWaterPumpEnabled]);

  // Helper functions
  const isValidTime = (time: string) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time.trim());
  };

  const formatTimeInput = (text: string) => {
    return text.replace(/\s?(am|pm)$/i, (match) => ` ${match.trim().toUpperCase()}`);
  };

  // Firebase operations
  const updateWaterPumpStatusInFirebase = (status: boolean) => {
    const db = getDatabase();
    const waterPumpRef = ref(db, 'actuators/waterPumpStatus');
    set(waterPumpRef, status);
  };

  // Event handlers
  const toggleWaterPump = () => {
    if (soilMoistureValue >= 100 && !isWaterPumpEnabled) {
      Alert.alert(
        "Moisture Level Full", 
        "Soil moisture is already at 100%. Water pump can't be turned on."
      );
      return;
    }
  
    setIsWaterPumpEnabled((prev) => {
      const newStatus = !prev;
      updateWaterPumpStatusInFirebase(newStatus);
      return newStatus;
    });
  };

  const toggleAWS = () => {
    setIsAWSEnabled((prev) => {
      const newStatus = !prev;
      const db = getDatabase();
      const awsRef = ref(db, 'automaticMode/awsStatus');
      set(awsRef, newStatus);
      return newStatus;
    });
  };

  const handleStartSubmit = () => {
    if (isValidTime(startTime)) {
      setEditingStep('end');
      setTimeout(() => endTimeInputRef.current?.focus(), 100);
    } else {
      Alert.alert('Invalid Start Time', 'Enter a valid time like 6:00 AM');
    }
  };

  const handleEndSubmit = () => {
    if (isValidTime(endTime)) {
      setConfirmedStartTime(startTime.trim());
      setConfirmedEndTime(endTime.trim());
      setEditingStep(null);
    } else {
      Alert.alert('Invalid End Time', 'Enter a valid time like 7:00 AM');
    }
  };

  const startEditingSchedule = () => {
    setStartTime(confirmedStartTime);
    setEndTime(confirmedEndTime);
    setEditingStep('start');
  };

  // Render loading state if data isn't ready
  if (!screenReady) return null;

  return (
    <View style={styles.container}>
      {/* Soil moisture display */}
      <View style={styles.progressBar}>
        <AnimatedCircleProgress
          value={soilMoistureValue}
          unit="%"
          colorScheme="water"
          size={200}
          strokeWidth={12}
          fontSize={32}
          fontColor="#2c3e50"
        />
      </View>

      {/* Controls section */}
      <View style={styles.containerOption}>
        {/* Water Pump Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>
            Water Pump {isWaterPumpEnabled ? '(ON)' : '(OFF)'}
          </Text>
          <CustomToggle 
            value={isWaterPumpEnabled!} 
            onValueChange={toggleWaterPump} 
          />
        </View>

        {/* Automatic Watering Schedule Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>
            Activate Watering Schedule
          </Text>
          <CustomToggle 
            value={isAWSEnabled} 
            onValueChange={toggleAWS} 
          />
        </View>

        {/* Watering Schedule Editor */}
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Watering Schedule</Text>
            <Pressable onPress={startEditingSchedule}>
              <Icon name="edit" size={20} color="#333" />
            </Pressable>
          </View>

          {editingStep ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {editingStep === 'start' ? (
                <>
                  <TextInput
                    value={startTime}
                    onChangeText={(text) => setStartTime(formatTimeInput(text))}
                    keyboardType="default"
                    placeholder="Start"
                    style={[styles.textwater, { width: 90 }]}
                    autoFocus
                  />
                  <Pressable onPress={handleStartSubmit}>
                    <Icon name="check" size={22} color="green" />
                  </Pressable>
                  <Text style={styles.textwater}>-</Text>
                  <Text style={[styles.textwater, { width: 90, color: '#aaa' }]}>
                    {endTime}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.textwater, { width: 90, color: '#aaa' }]}>
                    {startTime}
                  </Text>
                  <Text style={styles.textwater}>-</Text>
                  <TextInput
                    ref={endTimeInputRef}
                    value={endTime}
                    onChangeText={(text) => setEndTime(formatTimeInput(text))}
                    keyboardType="default"
                    placeholder="End"
                    style={[styles.textwater, { width: 90 }]}
                    autoFocus
                  />
                  <Pressable onPress={handleEndSubmit}>
                    <Icon name="check" size={22} color="green" />
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.textwater}>
              {confirmedStartTime} - {confirmedEndTime}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default WaterLevelScreen;
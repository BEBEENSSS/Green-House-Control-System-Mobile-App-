import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Alert, findNodeHandle, NativeModules } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { styles } from '../styles/ScreenStyles';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Esp32DataContext } from '../data/Esp32Data';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getPhilippineTime } from '../utils/getPhilippineTime';

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
  const [isWateringTime, setIsWateringTime] = useState(false);

  // Refs
  const startTimeInputRef = useRef<TextInput>(null);
  const endTimeInputRef = useRef<TextInput>(null);

  // Helper functions
  const convertTo24Hour = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  const checkIfWateringTime = () => {
    const now = getPhilippineTime(); // Use Philippine time instead of local time
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const startMinutes = convertTo24Hour(confirmedStartTime);
    const endMinutes = convertTo24Hour(confirmedEndTime);

    return currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes;
  };

  // Check watering schedule periodically
  useEffect(() => {
    const checkAndUpdatePumpStatus = () => {
      const shouldBeWatering = checkIfWateringTime();
      setIsWateringTime(shouldBeWatering);
      /*
      console.log('Current Philippine Time:', getPhilippineTime().toLocaleTimeString());
      console.log('Watering Schedule:', confirmedStartTime, '-', confirmedEndTime);
      console.log('Should be watering:', shouldBeWatering);
      console.log('AWS Enabled:', isAWSEnabled);
      console.log('Soil Moisture:', soilMoistureValue);
      console.log('Current Pump Status:', isWaterPumpEnabled);
      */

      if (soilMoistureValue >= 100 && isWaterPumpEnabled) {
        console.log('Soil moisture reached 100%, turning pump OFF');
        updateWaterPumpStatusInFirebase(false);
        setIsWaterPumpEnabled(false);
        return;
      }

      if (isAWSEnabled && shouldBeWatering && soilMoistureValue < 100) {
        if (!isWaterPumpEnabled) {
          console.log('Turning pump ON - conditions met');
          updateWaterPumpStatusInFirebase(true);
          setIsWaterPumpEnabled(true);
        }
      } else if (isWaterPumpEnabled && (!isAWSEnabled || !shouldBeWatering || soilMoistureValue >= 100)) {
        console.log('Turning pump OFF - conditions not met');
        updateWaterPumpStatusInFirebase(false);
        setIsWaterPumpEnabled(false);
      }
    };

    checkAndUpdatePumpStatus();

    const interval = setInterval(checkAndUpdatePumpStatus, 6000); // Check every minute

    return () => clearInterval(interval);
  }, [isAWSEnabled, confirmedStartTime, confirmedEndTime, soilMoistureValue, isWaterPumpEnabled]);

  // Firebase data loading
  useEffect(() => {
    const db = getDatabase();
    const waterPumpRef = ref(db, 'actuators/waterPumpStatus');
    const awsRef = ref(db, 'automaticMode/awsStatus');
    const scheduleRef = ref(db, 'soilMoisture/schedule');

    let waterPumpLoaded = false;
    let awsLoaded = false;
    let scheduleLoaded = false;

    const checkReady = () => {
      if (waterPumpLoaded && awsLoaded && scheduleLoaded) {
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

    const unsubscribeSchedule = onValue(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setConfirmedStartTime(data.startTime || '6:00 AM');
        setConfirmedEndTime(data.endTime || '7:00 AM');
        setStartTime(data.startTime || '6:00 AM');
        setEndTime(data.endTime || '7:00 AM');
      }
      scheduleLoaded = true;
      checkReady();
    });

    return () => {
      unsubscribeWaterPump();
      unsubscribeAWS();
      unsubscribeSchedule();
    };
  }, []);

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

  const saveScheduleToFirebase = (start: string, end: string) => {
    const db = getDatabase();
    const scheduleRef = ref(db, 'soilMoisture/schedule');
    set(scheduleRef, {
      startTime: start,
      endTime: end
    });
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
    const formattedTime = formatTimeInput(startTime);
    setStartTime(formattedTime);
    
    if (isValidTime(formattedTime)) {
      setEditingStep('end');
      setTimeout(() => {
        endTimeInputRef.current?.focus();
      }, 100);
    } else {
      Alert.alert('Invalid Start Time', 'Please enter time in format like "6:00 AM"');
      setTimeout(() => {
        const input = findNodeHandle(startTimeInputRef.current);
        NativeModules.UIManager.focus(input);
      }, 100);
    }
  };
  
  const handleEndSubmit = () => {
    const formattedEndTime = formatTimeInput(endTime);
    setEndTime(formattedEndTime);
    
    const formattedStartTime = formatTimeInput(startTime);
    
    if (!isValidTime(formattedEndTime)) {
      Alert.alert('Invalid End Time', 'Please enter time in format like "7:00 AM"');
      setTimeout(() => {
        const input = findNodeHandle(endTimeInputRef.current);
        NativeModules.UIManager.focus(input);
      }, 100);
      return;
    }
  
    const startMinutes = convertTo24Hour(formattedStartTime);
    const endMinutes = convertTo24Hour(formattedEndTime);
  
    if (endMinutes <= startMinutes) {
      Alert.alert('Invalid Schedule', 'End time must be after start time');
      setTimeout(() => {
        const input = findNodeHandle(endTimeInputRef.current);
        NativeModules.UIManager.focus(input);
      }, 100);
      return;
    }
  
    setConfirmedStartTime(formattedStartTime);
    setConfirmedEndTime(formattedEndTime);
    setEditingStep(null);
    saveScheduleToFirebase(formattedStartTime, formattedEndTime);
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
            Activate Watering Schedule {isAWSEnabled && isWateringTime}
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
                    ref={startTimeInputRef}
                    value={startTime}
                    onChangeText={(text) => setStartTime(text)}
                    onSubmitEditing={handleStartSubmit}
                    keyboardType="default"
                    placeholder="Start"
                    style={[styles.textwater, { width: 90 }]}
                    autoFocus
                    returnKeyType="next"
                  />
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
                    onChangeText={(text) => setEndTime(text)}
                    onSubmitEditing={handleEndSubmit}
                    keyboardType="default"
                    placeholder="End"
                    style={[styles.textwater, { width: 90 }]}
                    returnKeyType="done"
                  />
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
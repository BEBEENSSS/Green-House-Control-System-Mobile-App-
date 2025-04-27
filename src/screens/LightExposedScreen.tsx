import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Pressable, Alert, Keyboard } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { styles } from '../styles/ScreenStyles';
import { Esp32DataContext } from '../data/Esp32Data';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getPhilippineTime } from '../utils/getPhilippineTime';

type LightExposedRouteProp = RouteProp<RootStackParamList, 'LightExposed'>;


const LightExposedScreen = () => {
  // Navigation and context
  const route = useRoute<LightExposedRouteProp>();
  const { id } = route.params;
  const { lightValue } = useContext(Esp32DataContext);
  const db = getDatabase();

  // State for loading status
  const [screenReady, setScreenReady] = useState(false);
  const [growLightLoaded, setGrowLightLoaded] = useState(false);
  const [autoModeLoaded, setAutoModeLoaded] = useState(false);
  const [lightExposureLoaded, setLightExposureLoaded] = useState(false);

  // Main toggle states
  const [isLightExposed, setIsLightExposed] = useState(true);
  const [isAutomaticLight, setIsAutomaticLight] = useState(false);

  // Light exposure settings
  const [startTime, setStartTime] = useState('7:00 AM');
  const [duration, setDuration] = useState('12');
  const [endTime, setEndTime] = useState('');
  const [exposurePercent, setExposurePercent] = useState(0);
  const [lastActivationTime, setLastActivationTime] = useState<number | null>(null);

  // Countdown states
  const [countdownPercent, setCountdownPercent] = useState(100);
  const [countdownEndTime, setCountdownEndTime] = useState<number | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // Editing states
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempDuration, setTempDuration] = useState(duration);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);

  // Constants
  const COUNTDOWN_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  // Firebase data loading
  useEffect(() => {
    const growLightRef = ref(db, 'actuators/growLightStatus');
    const autoModeRef = ref(db, 'automaticMode/automaticGrLight');
    const lightExposureRef = ref(db, 'lightExposure');
    const lightExPercentageRef = ref(db, 'lightExposure/lightExPercentage');
    const lastActivationRef = ref(db, 'lightExposure/lastActivationTime');
    const countdownEndTimeRef = ref(db, 'lightExposure/countdownEndTime');
    const countdownPercentRef = ref(db, 'lightExposure/countdownPercent');

    const unsubscribeGrowLight = onValue(growLightRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsLightExposed(snapshot.val());
      }
      setGrowLightLoaded(true);
    });

    const unsubscribeAutoMode = onValue(autoModeRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsAutomaticLight(snapshot.val());
      }
      setAutoModeLoaded(true);
    });

    const unsubscribeLightExposure = onValue(lightExposureRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.startTime) setStartTime(data.startTime);
        if (data.duration) setDuration(data.duration);
        if (data.endTime) setEndTime(data.endTime);
      }
      setLightExposureLoaded(true);
    });

    const unsubscribePercentage = onValue(lightExPercentageRef, (snapshot) => {
      if (snapshot.exists()) {
        setExposurePercent(snapshot.val());
      }
    });

    const unsubscribeLastActivation = onValue(lastActivationRef, (snapshot) => {
      if (snapshot.exists()) {
        setLastActivationTime(snapshot.val());
      }
    });

    const unsubscribeCountdownEndTime = onValue(countdownEndTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        setCountdownEndTime(snapshot.val());
      }
    });

    const unsubscribeCountdownPercent = onValue(countdownPercentRef, (snapshot) => {
      if (snapshot.exists()) {
        setCountdownPercent(snapshot.val());
      }
    });

    return () => {
      unsubscribeGrowLight();
      unsubscribeAutoMode();
      unsubscribeLightExposure();
      unsubscribePercentage();
      unsubscribeLastActivation();
      unsubscribeCountdownEndTime();
      unsubscribeCountdownPercent();
    };
  }, []);

  useEffect(() => {
    if (growLightLoaded && autoModeLoaded && lightExposureLoaded) {
      setScreenReady(true);
    }
  }, [growLightLoaded, autoModeLoaded, lightExposureLoaded]);

  // Calculate time progress and countdown
  useEffect(() => {
    const calculateProgress = () => {
      if (!startTime || !duration) return;

      // Get current Philippine time
      const now = getPhilippineTime();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      const currentTimeMs = now.getTime();
      
      const { hours: startH, minutes: startM } = parseTime(startTime);
      const startTimeInMinutes = startH * 60 + startM;
      const durationInMinutes = parseFloat(duration) * 60;
      const endTimeInMinutes = (startTimeInMinutes + durationInMinutes) % 1440; // Wrap around midnight

      // Calculate whether we're in an overnight schedule
      const isOvernight = startTimeInMinutes + durationInMinutes > 1440;
      
      // Calculate progress
      let percentage = 0;
      let shouldBeActive = false;

      if (isOvernight) {
        // Overnight schedule case (e.g. 6:00 PM to 4:00 AM)
        if (currentTimeInMinutes >= startTimeInMinutes) {
          // After start time, same day
          const elapsed = currentTimeInMinutes - startTimeInMinutes;
          percentage = (elapsed / durationInMinutes) * 100;
          shouldBeActive = true;
        } else if (currentTimeInMinutes < endTimeInMinutes) {
          // After midnight, before end time
          const elapsed = (1440 - startTimeInMinutes) + currentTimeInMinutes;
          percentage = (elapsed / durationInMinutes) * 100;
          shouldBeActive = true;
        } else {
          // Before start time or after end time
          percentage = currentTimeInMinutes < startTimeInMinutes ? 0 : 100;
        }
      } else {
        // Normal same-day schedule
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
          const elapsed = currentTimeInMinutes - startTimeInMinutes;
          percentage = (elapsed / durationInMinutes) * 100;
          shouldBeActive = true;
        } else {
          percentage = currentTimeInMinutes < startTimeInMinutes ? 0 : 100;
        }
      }

      // Clamp percentage between 0-100
      percentage = Math.max(0, Math.min(100, percentage));

      // Update states
      setExposurePercent(percentage);
      set(ref(db, 'lightExposure/lightExPercentage'), Math.round(percentage));

      // Handle countdown logic
      if (percentage >= 100 || currentTimeInMinutes < startTimeInMinutes) {
        // Schedule is done or hasn't started yet - check if we should start countdown
        if (!isCountdownActive) {
          // Calculate when the countdown should end (8 hours after schedule end)
          let countdownEndTimeMs;
          
          if (percentage >= 100) {
            // Schedule is complete - calculate end time in milliseconds
            const endTimeDate = new Date(now);
            if (isOvernight && currentTimeInMinutes < endTimeInMinutes) {
              // Current time is after midnight but before end time (overnight schedule)
              endTimeDate.setHours(Math.floor(endTimeInMinutes / 60), endTimeInMinutes % 60, 0, 0);
            } else {
              // Normal case - schedule ended today
              endTimeDate.setHours(Math.floor(endTimeInMinutes / 60), endTimeInMinutes % 60, 0, 0);
            }
            countdownEndTimeMs = endTimeDate.getTime() + COUNTDOWN_DURATION;
          } else {
            // Schedule hasn't started yet - countdown starts from now
            countdownEndTimeMs = currentTimeMs + COUNTDOWN_DURATION;
          }
          
          setCountdownEndTime(countdownEndTimeMs);
          set(ref(db, 'lightExposure/countdownEndTime'), countdownEndTimeMs);
          setIsCountdownActive(true);
        }
      } else {
        // Schedule is active - reset countdown
        if (isCountdownActive) {
          setIsCountdownActive(false);
          setCountdownPercent(100);
          set(ref(db, 'lightExposure/countdownPercent'), 100);
        }
      }

      // Calculate countdown if active
      if (isCountdownActive && countdownEndTime) {
        const remaining = Math.max(0, countdownEndTime - currentTimeMs);
        const newCountdownPercent = (remaining / COUNTDOWN_DURATION) * 100;
        
        setCountdownPercent(newCountdownPercent);
        set(ref(db, 'lightExposure/countdownPercent'), newCountdownPercent);

        if (remaining <= 0) {
          // Countdown finished
          setIsCountdownActive(false);
        }
      }

      if (isAutomaticLight) {
        if (shouldBeActive !== isLightExposed) {
          setIsLightExposed(shouldBeActive);
          set(ref(db, 'actuators/growLightStatus'), shouldBeActive);
        }
      }
    };

    const parseTime = (timeStr: string) => {
      // Handle cases where timeStr might have extra spaces
      const cleanedTimeStr = timeStr.trim().toUpperCase();
      const [time, meridian] = cleanedTimeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      // Convert to 24-hour format
      if (meridian === 'PM' && hours !== 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;

      return { hours, minutes };
    };

    // Update the progress interval
    const progressInterval = setInterval(calculateProgress, 60000); // Update every second
    calculateProgress(); // Run immediately

    return () => clearInterval(progressInterval);
  }, [startTime, duration, isAutomaticLight, lastActivationTime, screenReady, isCountdownActive, countdownEndTime]);

  // Automatic light control based on lightValue (only when in automatic mode)
  useEffect(() => {
    if (isAutomaticLight) {
      // Only react to lightValue if the schedule is still ongoing (less than 100%)
      if (exposurePercent < 100) {
        const shouldTurnOff = lightValue === 'Bright';
        if (shouldTurnOff !== !isLightExposed) {
          const newStatus = !shouldTurnOff;
          setIsLightExposed(newStatus);
          set(ref(db, 'actuators/growLightStatus'), newStatus);
        }
      } else {
        // If exposure is complete, make sure grow light is OFF
        if (isLightExposed) {
          setIsLightExposed(false);
          set(ref(db, 'actuators/growLightStatus'), false);
        }
      }
    }
  }, [lightValue, isAutomaticLight, exposurePercent, isLightExposed]);
  
  // Helper functions
  const isValidTime = (time: string) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time.trim());
  };

  const parseTime = (timeStr: string) => {
    const [time, meridian] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  };

  const calculateEndTime = (start: string, dur: string) => {
    const { hours, minutes } = parseTime(start);
    const hoursToAdd = parseFloat(dur);

    let totalMinutes = hours * 60 + minutes + (hoursToAdd * 60);
    totalMinutes %= 1440; // Wrap around if exceeds 24 hours

    let endHour = Math.floor(totalMinutes / 60);
    let endMinute = totalMinutes % 60;

    const endMeridian = endHour >= 12 ? 'PM' : 'AM';
    endHour = endHour % 12 || 12;

    return `${endHour}:${endMinute.toString().padStart(2, '0')} ${endMeridian}`;
  };

  // Toggle handlers
  const toggleLightExposed = () => {
    const newStatus = !isLightExposed;
    setIsLightExposed(newStatus);
    set(ref(db, 'actuators/growLightStatus'), newStatus);
    
    // Disable automatic mode if manually toggling
    if (isAutomaticLight) {
      setIsAutomaticLight(false);
      set(ref(db, 'automaticMode/automaticGrLight'), false);
    }
  };

  const toggleAutomaticLight = () => {
    const newStatus = !isAutomaticLight;
    setIsAutomaticLight(newStatus);
    set(ref(db, 'automaticMode/automaticGrLight'), newStatus);

    // When enabling automatic mode, set the activation time if within schedule
    if (newStatus) {
      const now = new Date();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      const { hours: startH, minutes: startM } = parseTime(startTime);
      const startTimeInMinutes = startH * 60 + startM;
      const durationInMinutes = parseFloat(duration) * 60;
      const endTimeInMinutes = startTimeInMinutes + durationInMinutes;

      // Check if current time is within the scheduled period
      const isWithinSchedule = startTimeInMinutes < endTimeInMinutes ?
        currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes :
        currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes % 1440;

      if (isWithinSchedule) {
        const activationTime = startTimeInMinutes * 60 * 1000;
        setLastActivationTime(activationTime);
        set(ref(db, 'lightExposure/lastActivationTime'), activationTime);
      }
    }
  };

  // Settings handlers
  const saveLightExposureSettings = (newStartTime: string, newDuration: string, newEndTime: string) => {
    set(ref(db, 'lightExposure'), {
      startTime: newStartTime,
      duration: newDuration,
      endTime: newEndTime,
    }).catch((error) => {
      console.error('Error saving to Firebase:', error);
    });
  };

  const confirmStartTime = () => {
    if (!isValidTime(tempStartTime)) {
      Alert.alert('Invalid Time Format', 'Use format like 7:00 AM');
      return;
    }
  
    const calculatedEndTime = calculateEndTime(tempStartTime, duration);
    if (calculatedEndTime) {
      setStartTime(tempStartTime);
      setEndTime(calculatedEndTime);
      setIsEditingStart(false);
      Keyboard.dismiss();
      saveLightExposureSettings(tempStartTime, duration, calculatedEndTime);
      
      // Reset activation time when schedule changes
      setLastActivationTime(null);
      set(ref(db, 'lightExposure/lastActivationTime'), null);
    }
  };

  const confirmDuration = () => {
    if (isNaN(parseInt(tempDuration)) || parseInt(tempDuration) <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid number of hours');
      return;
    }
  
    const calculatedEndTime = calculateEndTime(startTime, tempDuration);
    if (calculatedEndTime) {
      setDuration(tempDuration);
      setEndTime(calculatedEndTime);
      setIsEditingDuration(false);
      Keyboard.dismiss();
      saveLightExposureSettings(startTime, tempDuration, calculatedEndTime);
      
      // Reset activation time when duration changes
      setLastActivationTime(null);
      set(ref(db, 'lightExposure/lastActivationTime'), null);
    }
  };

  const handleStartTimeSubmit = () => confirmStartTime();
  const handleDurationSubmit = () => confirmDuration();

  if (!screenReady) return null;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <AnimatedCircleProgress
          value={isCountdownActive ? Math.round(countdownPercent) : Math.round(exposurePercent)}
          unit="%"
          colorScheme="light"
          size={200}
          strokeWidth={12}
          fontSize={32}
          fontColor="#2c3e50"
        />
      </View>

      <View style={styles.containerOption}>
        {/* Grow Light Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Grow Light {isLightExposed ? '(ON)' : '(OFF)'}</Text>
          <CustomToggle value={isLightExposed} onValueChange={toggleLightExposed} />
        </View>

        {/* Automatic Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Automatic Mode</Text>
          <CustomToggle value={isAutomaticLight} onValueChange={toggleAutomaticLight} />
        </View> 

        {/* START TIME */}
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Start Time </Text>
            <Pressable onPress={() => {
              setTempStartTime(startTime);
              setIsEditingStart(true);
            }}>
              <Icon name="edit" size={20} color="#333" />
            </Pressable>
          </View>

          {isEditingStart ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.textwater, { flex: 1 }]}
                value={tempStartTime}
                onChangeText={setTempStartTime}
                autoFocus
                onSubmitEditing={handleStartTimeSubmit}
                blurOnSubmit={false}
              />
              <Pressable onPress={confirmStartTime}>
                <Icon name="check" size={24} color="green" />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.textwater}>{startTime}</Text>
          )}
        </View>

        {/* DURATION */}
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Set Light Exposure (hrs)</Text>
            <Pressable onPress={() => {
              setTempDuration(duration);
              setIsEditingDuration(true);
            }}>
              <Icon name="edit" size={20} color="#333" />
            </Pressable>
          </View>

          {isEditingDuration ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.textwater, { flex: 1 }]}
                value={tempDuration}
                onChangeText={setTempDuration}
                keyboardType="numeric"
                autoFocus
                onSubmitEditing={handleDurationSubmit}
                blurOnSubmit={false}
              />
            </View>
          ) : (
            <Text style={styles.textwater}>{duration} hour(s)</Text>
          )}
        </View>

        {/* END TIME */}
        {endTime !== '' && (
          <View style={styles.toggleContainer}>
            <Text style={styles.textOption}>Ends at:</Text>
            <Text style={styles.textwater}>{endTime}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default LightExposedScreen;
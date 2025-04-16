import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import { Esp32DataContext } from '../data/Esp32Data';
import { styles } from '../styles/ScreenStyles';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';

type LightExposedRouteProp = RouteProp<RootStackParamList, 'LightExposed'>;

const LightExposedScreen = () => {
  const route = useRoute<LightExposedRouteProp>();
  const { id } = route.params;
  const { lightValue } = useContext(Esp32DataContext);

  const [isLightExposed, setIsLightExposed] = useState(true);
  const [isAutomaticLight, setIsAutomaticLight] = useState(false);

  // Sync grow light toggle with lightValue when Automatic is enabled
  useEffect(() => {
    if (isAutomaticLight) {
      if (lightValue === 'Bright') {
        setIsLightExposed(false);
      } else {
        setIsLightExposed(true);
      }
    }
  }, [lightValue, isAutomaticLight]);

  // Determine display status for Grow Light
  const growLightStatus = isLightExposed ? 'ON' : 'OFF';

  // Handle manual toggle of Grow Light
  const toggleLightExposed = () => {
    if (isAutomaticLight) {
      setIsAutomaticLight(false); // Disable automatic if user toggles manually
    }
    setIsLightExposed(prev => !prev);
  };

  const toggleAutomaticLight = () => {
    setIsAutomaticLight(prev => !prev);
  };

  const [startTime, setStartTime] = useState('7:00 AM');
  const [duration, setDuration] = useState('12');
  const [endTime, setEndTime] = useState('');

  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);

  const isValidTime = (time: string) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time.trim());
  };

  const calculateEndTime = () => {
    const time = startTime.trim().toUpperCase();
    const match = time.match(/(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)/i);
    const hoursToAdd = parseInt(duration);

    if (!match) {
      Alert.alert('Invalid Start Time', 'Please enter a valid start time like 7:00 AM');
      return;
    }

    let hours = parseInt(match[1]);
    let minutes = parseInt(match[2]);
    let meridian = match[3].toUpperCase();

    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    let totalMinutes = hours * 60 + minutes + (hoursToAdd * 60);
    totalMinutes %= 1440;

    let endHour = Math.floor(totalMinutes / 60);
    let endMinute = totalMinutes % 60;

    const endMeridian = endHour >= 12 ? 'PM' : 'AM';
    endHour = endHour % 12 || 12;

    const formattedEndTime = `${endHour}:${endMinute.toString().padStart(2, '0')} ${endMeridian}`;
    setEndTime(formattedEndTime);
  };

  useEffect(() => {
    if (isAutomaticLight) {
      calculateEndTime();
    }
  }, [startTime, duration, isAutomaticLight]);

  const handleStartTimeConfirm = () => {
    if (!isValidTime(startTime)) {
      Alert.alert('Invalid Time Format', 'Use format like 7:00 AM');
      return;
    }
    setIsEditingStart(false);
    calculateEndTime();
  };

  const handleDurationConfirm = () => {
    if (isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid number of hours');
      return;
    }
    setIsEditingDuration(false);
    calculateEndTime();
  };

  const [elapsedHours, setElapsedHours] = useState(0);
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
  
    if (isLightExposed) {
      timer = setInterval(() => {
        setElapsedHours(prev => {
          const newTime = prev + 1 / 60; // simulate 1 minute = 1/60 hour
          if (newTime >= parseFloat(duration)) {
            clearInterval(timer!); // Stop counting when target reached
          }
          return newTime;
        });
      }, 60000); // every 1 minute (simulate real-time)
  
    } else {
      if (timer) clearInterval(timer);
    }
  
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLightExposed, duration]);

  const exposurePercent = Math.min(
    (elapsedHours / parseFloat(duration)) * 100,
    100
  );

  useEffect(() => {
    if (!isAutomaticLight || !isValidTime(startTime) || isNaN(parseFloat(duration))) return;
  
    const interval = setInterval(() => {
      const now = new Date();
  
      const parseTime = (timeStr: string) => {
        const [time, meridian] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
  
        if (meridian === 'PM' && hours !== 12) hours += 12;
        if (meridian === 'AM' && hours === 12) hours = 0;
  
        return { hours, minutes };
      };
  
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const { hours: startH, minutes: startM } = parseTime(startTime);
      const startMinutes = startH * 60 + startM;
      const endMinutes = (startMinutes + parseFloat(duration) * 60) % 1440;
  
      const isWithinRange = startMinutes < endMinutes
        ? nowMinutes >= startMinutes && nowMinutes < endMinutes
        : nowMinutes >= startMinutes || nowMinutes < endMinutes;
  
      setIsLightExposed(isWithinRange);
      if (!isWithinRange) setElapsedHours(0); // reset if outside duration
    }, 60000); // check every minute
  
    return () => clearInterval(interval);
  }, [isAutomaticLight, startTime, duration]);
  
  

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <AnimatedCircleProgress
          value={Math.round(exposurePercent)}
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
          <Text style={styles.textOption}>Grow Light ({growLightStatus})</Text>
          <CustomToggle value={isLightExposed} onValueChange={toggleLightExposed} />
        </View>

        {/* Automatic Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Automatic</Text>
          <CustomToggle value={isAutomaticLight} onValueChange={toggleAutomaticLight} />
        </View> 

        {/* START TIME */}
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Start Time </Text>
            <Pressable onPress={() => setIsEditingStart(true)}>
              <Icon name="edit" size={20} color="#333" />
            </Pressable>
          </View>

          {isEditingStart ? (
            <TextInput
              style={[styles.textwater, { flex: 1 }]}
              value={startTime}
              onChangeText={setStartTime}
              autoFocus
              onSubmitEditing={handleStartTimeConfirm}
              onBlur={handleStartTimeConfirm}
            />
          ) : (
            <Text style={styles.textwater}>{startTime}</Text>
          )}
        </View>

        {/* DURATION */}
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Set Light Exposure (hrs)</Text>
            <Pressable onPress={() => setIsEditingDuration(true)}>
              <Icon name="edit" size={20} color="#333" />
            </Pressable>
          </View>

          {isEditingDuration ? (
            <TextInput
              style={[styles.textwater, { flex: 1 }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              autoFocus
              onSubmitEditing={handleDurationConfirm}
              onBlur={handleDurationConfirm}
            />
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

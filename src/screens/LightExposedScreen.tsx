import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import { useSharedData } from '../data/Esp32Data';
import { styles } from '../styles/ScreenStyles';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';

type LightExposedRouteProp = RouteProp<RootStackParamList, 'LightExposed'>;

const LightExposedScreen = () => {
  const route = useRoute<LightExposedRouteProp>();
  const { id } = route.params;
  const { lightValue } = useSharedData();

  const [isLightExposed, isLightExposedEnabled] = useState(false);
  const [startTime, setStartTime] = useState('7:00 AM');
  const [duration, setDuration] = useState('12'); // in hours
  const [endTime, setEndTime] = useState('');

  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);

  const toggleLightExposed = () => {
    isLightExposedEnabled(prev => !prev);
  };

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

    // Convert to 24-hour format
    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    // Add duration
    let totalMinutes = hours * 60 + minutes + (hoursToAdd * 60);
    totalMinutes %= 1440;

    let endHour = Math.floor(totalMinutes / 60);
    let endMinute = totalMinutes % 60;

    const endMeridian = endHour >= 12 ? 'PM' : 'AM';
    endHour = endHour % 12 || 12;

    const formattedEndTime = `${endHour}:${endMinute.toString().padStart(2, '0')} ${endMeridian}`;
    setEndTime(formattedEndTime);
  };

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

  const [isAutomaticLight, setIsAutomaticLight] = useState(false);

  const toggleAutomaticLight = () => {
    setIsAutomaticLight(previousState => !previousState);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <AnimatedCircleProgress
          value={lightValue}
          unit="%"
          colorScheme="light"
          size={200}
          strokeWidth={12}
          fontSize={32}
          fontColor="#2c3e50"
        />
      </View>

      <View style={styles.containerOption}>
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Turn on Grow Light</Text>
          <CustomToggle value={isLightExposed} onValueChange={toggleLightExposed} />
        </View>

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
          <Text style={[styles.textwater]}>{endTime}
          </Text>
        </View>
        )}
      </View>
    </View>
  );
};

export default LightExposedScreen;

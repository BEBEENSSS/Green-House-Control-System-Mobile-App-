import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import { Esp32DataContext } from '../data/Esp32Data';
import { styles } from '../styles/ScreenStyles';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';

type WaterLevelRouteProp = RouteProp<RootStackParamList, 'WaterLevel'>;

const WaterLevelScreen = () => {
  const route = useRoute<WaterLevelRouteProp>();
  const { id } = route.params;

  const { soilMoistureValue } = React.useContext(Esp32DataContext);

  const [isWaterPumpEnabled, setIsWaterPumpEnabled] = useState(false);

  const [startTime, setStartTime] = useState('6:00 AM');
  const [endTime, setEndTime] = useState('7:00 AM');
  const [confirmedStartTime, setConfirmedStartTime] = useState('6:00 AM');
  const [confirmedEndTime, setConfirmedEndTime] = useState('7:00 AM');
  const [editingStep, setEditingStep] = useState<'start' | 'end' | null>(null);

  const endTimeInputRef = useRef<TextInput>(null);

  const toggleWaterPump = () => {
    setIsWaterPumpEnabled(prev => !prev);
  };

  const isValidTime = (time: string) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time.trim());
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


  const formatTimeInput = (text: string) => {
    return text.replace(/\s?(am|pm)$/i, (match) => ` ${match.trim().toUpperCase()}`);
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.containerOption}>
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Water Pump</Text>
          <CustomToggle value={isWaterPumpEnabled} onValueChange={toggleWaterPump} />
        </View>

        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Watering Hour </Text>
            <Pressable onPress={() => {
              setStartTime(confirmedStartTime);
              setEndTime(confirmedEndTime);
              setEditingStep('start');
            }}>
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
                  <Text style={[styles.textwater, { width: 90, color: '#aaa' }]}>{endTime}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.textwater, { width: 90, color: '#aaa' }]}>{startTime}</Text>
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

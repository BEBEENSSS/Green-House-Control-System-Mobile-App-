import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { styles } from '../styles/ScreenStyles';
import AnimatedCircleProgress from '../components/AnimatedCircleProgress';
import CustomToggle from '../components/CustomToggle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Esp32DataContext } from '../data/Esp32Data';


type TemperatureRouteProp = RouteProp<RootStackParamList, 'Temperature'>;

const TemperatureScreen = () => {
  const route = useRoute<TemperatureRouteProp>();
  const { id } = route.params;
  
  const [isExhaustFanEnabled, setIsExhaustFanEnabled] = useState(false);
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [fanTemp, setFanTemp] = useState('24');
  const [confirmedFanTemp, setConfirmedFanTemp] = useState('24');
  const [isEditing, setIsEditing] = useState(false);

  const { tempValue } = React.useContext(Esp32DataContext);

  const toggleExhaustFan = () => {
    setIsExhaustFanEnabled(previousState => !previousState);
  };

  const toggleAutomatic = () => {
    setIsAutomatic(previousState => !previousState);
  };

  const getTempColor = (temp: number) => {
    if (temp >= 40) return '#FF4500';
    if (temp >= 30) return '#FFD700';
    if (temp >= 20) return '#00C851';
    return '#1E90FF';
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <AnimatedCircleProgress
          value={tempValue} // Use the state tempValue fetched from Firebase
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
          <CustomToggle value={isExhaustFanEnabled} onValueChange={toggleExhaustFan} />
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.textOption}>Automatic</Text>
          <CustomToggle value={isAutomatic} onValueChange={toggleAutomatic} />
        </View>
        <View style={styles.toggleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textOption}>Fan turn on at </Text>
            <Pressable onPress={() => {
              setFanTemp(confirmedFanTemp);  // start editing with current confirmed value
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
                  setConfirmedFanTemp(fanTemp); // save new value
                  setIsEditing(false);
                }}
                onBlur={() => {
                  setFanTemp(confirmedFanTemp); // revert to last saved value
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

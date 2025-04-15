import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Animated, StyleSheet } from 'react-native';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const CustomToggle: React.FC<CustomToggleProps> = ({ value, onValueChange }) => {
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 32], // Adjust for size of the knob
  });

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#BDBDBD', '#00C851'],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor }]}>
        <Animated.View style={[styles.toggleKnob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  toggleTrack: {
    width: 55,
    height: 25,
    borderRadius: 99,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
});

export default CustomToggle;

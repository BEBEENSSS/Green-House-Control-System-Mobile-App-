import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  value: number;
  unit?: string;
  colorScheme?: 'temp' | 'water' | 'light';
  size?: number;
  strokeWidth?: number; // New prop for stroke customization
  fontSize?: number; // New prop for font customization
  fontColor?: string; // New prop for font color
}

const AnimatedCircleProgress = ({ 
  value, 
  unit = '°C', 
  colorScheme = 'temp', 
  size = 80,
  strokeWidth = 8, // Default stroke width
  fontSize = 16, // Default font size
  fontColor = '#333' // Default font color
}: Props) => {
  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedStroke = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  // Max value per type
  const maxValue = colorScheme === 'temp' ? 70 : 100;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    Animated.timing(animatedStroke, {
      toValue: Math.min(value, maxValue),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [value]);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    return () => {
      animatedValue.removeListener(listener);
    };
  }, []);

  const strokeDashoffset = animatedStroke.interpolate({
    inputRange: [0, maxValue],
    outputRange: [circumference, 0],
  });

  // Dynamic color logic
  let strokeColor = '#00BFFF';
  if (colorScheme === 'temp') {
    if (value >= 40) strokeColor = '#FF4500';
    else if (value >= 36) strokeColor = '#FFD700';
    else if (value >= 20) strokeColor = '#00C851';
    else strokeColor = '#1E90FF';
  } else if (colorScheme === 'water') {
    strokeColor = value > 50 ? '#00C851' : '#ffbb33';
  } else if (colorScheme === 'light') {
    strokeColor = value > 70 ? '#00C851' : '#4FC3F7';
  }

  return (
    <View style={styles.container}>
      <Svg height={size} width={size}>
        <Circle
          stroke="#eee"
          fill="none"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          stroke={strokeColor}
          fill="none"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="90"
          origin={`${radius}, ${radius}`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.text, { fontSize, color: fontColor }]}>
          {displayValue}
          {unit}
        </Text>
      </View>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});

export default AnimatedCircleProgress;
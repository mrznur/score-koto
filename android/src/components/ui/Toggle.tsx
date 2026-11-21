import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface ToggleProps {
  defaultOn?: boolean;
}

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 18;
const THUMB_SIZE = 12;
const THUMB_OFF = 2;
const THUMB_ON = 16;

export default function Toggle({ defaultOn = false }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  const translateX = useRef(new Animated.Value(defaultOn ? THUMB_ON : THUMB_OFF)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: on ? THUMB_ON : THUMB_OFF,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [on, translateX]);

  return (
    <TouchableWithoutFeedback onPress={() => setOn(prev => !prev)}>
      <View
        style={[
          styles.track,
          { backgroundColor: on ? Colors.primary : Colors.light.soft },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              backgroundColor: on ? '#FFFFFF' : Colors.light.muted,
            },
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});

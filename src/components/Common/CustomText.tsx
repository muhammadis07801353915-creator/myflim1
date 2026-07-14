import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: 'NRT-Regular' }, style]} {...props} />;
}

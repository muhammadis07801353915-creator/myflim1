import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export const PistonIcon = ({ size = 20, color = "#CC222F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Left Piston */}
    <G transform="rotate(45, 12, 12)">
      <Rect x="8" y="2" width="8" height="6" rx="1" />
      <Path d="M8 5h8" />
      <Path d="M11 8v7" />
      <Path d="M13 8v7" />
      <Circle cx="12" cy="18" r="3" />
    </G>
    {/* Right Piston */}
    <G transform="rotate(-45, 12, 12)">
      <Rect x="8" y="2" width="8" height="6" rx="1" />
      <Path d="M8 5h8" />
      <Path d="M11 8v7" />
      <Path d="M13 8v7" />
      <Circle cx="12" cy="18" r="3" />
    </G>
  </Svg>
);

export const GearStickIcon = ({ size = 20, color = "#CC222F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="5" r="3" />
    <Path d="M12 8v6" />
    <Rect x="5" y="12" width="14" height="10" rx="2" />
    <Path d="M8 15v4" />
    <Path d="M12 15v4" />
    <Path d="M16 15v4" />
    <Path d="M8 17h8" />
  </Svg>
);

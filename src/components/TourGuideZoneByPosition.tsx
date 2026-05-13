import * as React from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadiusObject, Shape } from '../types';
import { TourGuideZone } from './TourGuideZone';

export interface TourGuideZoneByPositionProps {
  zone: number;
  tourKey?: string;
  isTourGuide?: boolean;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  width?: DimensionValue;
  height?: DimensionValue;
  shape?: Shape;
  borderRadiusObject?: BorderRadiusObject;
  containerStyle?: StyleProp<ViewStyle>;
  keepTooltipPosition?: boolean;
  tooltipBottomOffset?: number;
  text?: string;
}

export const TourGuideZoneByPosition = ({
  isTourGuide,
  zone,
  tourKey = '_default',
  width,
  height,
  top,
  left,
  right,
  bottom,
  shape,
  containerStyle,
  keepTooltipPosition,
  tooltipBottomOffset,
  borderRadiusObject,
  text,
}: TourGuideZoneByPositionProps) => {
  if (!isTourGuide) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, containerStyle]}>
      <TourGuideZone
        isTourGuide
        {...{
          tourKey,
          zone,
          shape,
          keepTooltipPosition,
          tooltipBottomOffset,
          borderRadiusObject,
          text,
        }}
        style={{
          position: 'absolute',
          height,
          width,
          top,
          right,
          bottom,
          left,
        }}
      />
    </View>
  );
};

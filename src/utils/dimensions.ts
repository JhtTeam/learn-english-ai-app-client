import {Dimensions, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const BASE_WIDTH = 375; // iPhone standard
const BASE_HEIGHT = 812;

export function wp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
}

export function hp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
}

export function scale(size: number): number {
  return PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / BASE_WIDTH));
}

export function verticalScale(size: number): number {
  return PixelRatio.roundToNearestPixel(size * (SCREEN_HEIGHT / BASE_HEIGHT));
}

export function moderateScale(size: number, factor = 0.5): number {
  return size + (scale(size) - size) * factor;
}

export {SCREEN_WIDTH, SCREEN_HEIGHT};

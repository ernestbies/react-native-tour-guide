import * as React from 'react';
import { ScrollView } from 'react-native';
import { IStep } from '../types';

export type Handler = (event?: any) => void;
export type TourGuideEvents = {
  start: undefined;
  stop: undefined;
  stepChange: IStep | undefined;
  '*': any;
};
export interface Emitter {
  on(type: string, handler: Handler): void;
  off(type: string, handler: Handler): void;
  emit(type: string, event?: any): void;
}
export type Ctx<T extends any> = Record<string, T> & { _default: T };

export interface ITourGuideContext {
  setTourKey?: (tourKey: string) => void;
  eventEmitter?: Ctx<Emitter>;
  canStart: Ctx<boolean>;
  registerStep?(key: string, step: IStep): void;
  unregisterStep?(key: string, stepName: string): void;
  getCurrentStep?(key: string): IStep | undefined;
  start?(key: string, fromStep?: number, scrollViewRef?: React.RefObject<ScrollView>): void;
  stop?(key: string): void;
  setScrollRef?: React.Dispatch<React.SetStateAction<React.RefObject<ScrollView> | null>>;
}

export const TourGuideContext = React.createContext<ITourGuideContext>({
  canStart: { _default: false },
});

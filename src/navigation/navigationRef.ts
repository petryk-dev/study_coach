import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

/** For navigating from outside screens, e.g. when the session expires */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const resetTo = (name: 'Login' | 'Home') => {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name }] });
  }
};

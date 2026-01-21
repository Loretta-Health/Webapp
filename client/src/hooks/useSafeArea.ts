import { Capacitor } from '@capacitor/core';

interface SafeAreaPadding {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

export function useSafeArea(): SafeAreaPadding {
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isNative = Capacitor.isNativePlatform();

  if (isIOS) {
    return {
      top: 'env(safe-area-inset-top, 0px)',
      bottom: 'env(safe-area-inset-bottom, 0px)',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)',
    };
  }

  if (isAndroid) {
    return {
      top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
      bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)',
    };
  }

  return {
    top: '1rem',
    bottom: '1rem',
    left: '0.5rem',
    right: '0.5rem',
  };
}

export function getDialogSafeAreaStyle(): React.CSSProperties {
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  if (isIOS) {
    return {
      padding: '0.5rem',
      paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
      paddingLeft: 'calc(0.5rem + env(safe-area-inset-left, 0px))',
      paddingRight: 'calc(0.5rem + env(safe-area-inset-right, 0px))',
    };
  }

  if (isAndroid) {
    return {
      padding: '0.75rem',
      paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
      paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
      paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))',
    };
  }

  return {
    padding: '1rem',
  };
}

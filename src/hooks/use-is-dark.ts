import { useColorScheme } from 'react-native';
import { useAppSelector } from '../store';

/**
 * Custom hook to determine if the active theme is dark.
 * Correctly respects the 'system' preference by reading the device color scheme.
 */
export function useIsDark(): boolean {
  const theme = useAppSelector((state) => state.settings.theme);
  const systemScheme = useColorScheme();

  if (theme === 'system') {
    return systemScheme === 'dark';
  }
  return theme === 'dark';
}

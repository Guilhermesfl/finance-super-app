import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';

import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="dark" />
      <DashboardScreen />
    </SafeAreaView>
  );
}

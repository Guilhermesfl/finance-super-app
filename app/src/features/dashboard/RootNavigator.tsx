import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConsolidatedDashboard } from './ConsolidatedDashboard';
import { PortfolioDetailScreen } from './PortfolioDetailScreen';
import type { RootStackParamList } from './navigationTypes';
import { colors } from '../../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.canvas,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        contentStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      <Stack.Screen
        name="ConsolidatedDashboard"
        component={ConsolidatedDashboard}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PortfolioDetail"
        component={PortfolioDetailScreen}
        options={({ route }) => ({
          title: route.params?.portfolioId || 'Portfolio',
        })}
      />
    </Stack.Navigator>
  );
}

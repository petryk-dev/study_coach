import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { COLORS } from '../constants/colors';
import DeckScreen from '../screens/DeckScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import NewDeckScreen from '../screens/NewDeckScreen';
import QuizResultsScreen from '../screens/QuizResultsScreen';
import QuizScreen from '../screens/QuizScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ReviewScreen from '../screens/ReviewScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  initialRouteName: 'Login' | 'Home';
};

export default function RootNavigator({ initialRouteName }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="NewDeck" component={NewDeckScreen} />
      <Stack.Screen name="Deck" component={DeckScreen} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal', gestureEnabled: false }}>
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

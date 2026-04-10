import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import HomeScreen from './src/screens/HomeScreen';

/**
 * Application root.
 * Redux store and SafeArea context are provided here so all
 * child components can access them unconditionally.
 */
const App: React.FC = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  </Provider>
);

export default App;

import * as SecureStore from 'expo-secure-store';

export const saveItem = (key: string, value: string) =>
  SecureStore.setItemAsync(key, value);

export const getItem = (key: string) => SecureStore.getItemAsync(key);

export const deleteItem = (key: string) => SecureStore.deleteItemAsync(key);

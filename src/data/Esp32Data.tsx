import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import Constants from 'expo-constants';


// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseURL,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 🔄 Context Setup
interface Esp32DataContextType {
  tempValue: number | null;
  soilMoistureValue: number | null;
  lightValue: string | null;
}

export const Esp32DataContext = createContext<Esp32DataContextType>({
  tempValue: null,
  soilMoistureValue: null,
  lightValue: null,
});

export const Esp32DataProvider = ({ children }: { children: ReactNode }) => {
  const [tempValue, setTempValue] = useState<number | null>(null);
  const [soilMoistureValue, setSoilMoistureValue] = useState<number | null>(null);
  const [lightValue, setLightValue] = useState<string | null>(null);

  useEffect(() => {
    const tempRef = ref(database, '/sensors/temperature');
    const unsubscribeTemp = onValue(tempRef, (snapshot) => {
      const data = snapshot.val();
      setTempValue(data);
    });

    const soilRef = ref(database, '/sensors/soilMoisture');
    const unsubscribeSoil = onValue(soilRef, (snapshot) => {
      const data = snapshot.val();
      setSoilMoistureValue(data);
    });

    const lightRef = ref(database, '/sensors/ldr');
    const unsubscribeLight = onValue(lightRef, (snapshot) => {
      const data = snapshot.val();
      setLightValue(data);
    });


    return () => {
      // Firebase onValue automatically cleans up; this is a safe unsubscriber placeholder
      unsubscribeTemp(); 
      unsubscribeSoil();
    };
  }, []);

  return (
    <Esp32DataContext.Provider value={{ tempValue, soilMoistureValue, lightValue }}>
      {children}
    </Esp32DataContext.Provider>
  );
};
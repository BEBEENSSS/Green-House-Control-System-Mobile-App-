// SharedDataContext.tsx
import React, { createContext, useState, useContext } from 'react';

type SharedDataContextType = {
  tempValue: number;
  setTempValue: (value: number) => void;
  waterValue: number;
  setWaterValue: (value: number) => void;
  lightValue: number;
  setLightValue: (value: number) => void;
};

const SharedDataContext = createContext<SharedDataContextType>({
  tempValue: 27, // Default value
  setTempValue: () => {},
  waterValue: 98, // Default value
  setWaterValue: () => {},
  lightValue: 89, // Default value
  setLightValue: () => {},
});

export const SharedDataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [tempValue, setTempValue] = useState(20);
  const [waterValue, setWaterValue] = useState(20);
  const [lightValue, setLightValue] = useState(20);

  return (
    <SharedDataContext.Provider value={{ tempValue, setTempValue, waterValue, setWaterValue, lightValue, setLightValue }}>
      {children}
    </SharedDataContext.Provider>
  );
};

export const useSharedData = () => useContext(SharedDataContext);
import React, { createContext, useContext, useMemo, useState } from 'react';

type LocationContextType = {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCity] = useState<string>('هەموو شارەکان');

  const value = useMemo(
    () => ({
      selectedCity,
      setSelectedCity,
    }),
    [selectedCity]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}

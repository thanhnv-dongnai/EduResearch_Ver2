import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearIdState] = useState(() => localStorage.getItem('selectedAcademicYearId') || null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [settingsData, years] = await Promise.all([
        settingsAPI.get(),
        settingsAPI.listAcademicYears()
      ]);
      setSettings(settingsData);
      setAcademicYears(years);
      setSelectedYearIdState(prev => {
        if (prev && years.some(y => y.id === prev)) return prev;
        const current = years.find(y => y.is_current) || years[0];
        return current ? current.id : null;
      });
    } catch (error) {
      console.error('Error loading settings/academic years:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [currentUser, refresh]);

  const setSelectedYearId = (id) => {
    setSelectedYearIdState(id);
    localStorage.setItem('selectedAcademicYearId', id);
  };

  const selectedYear = academicYears.find(y => y.id === selectedYearId) || null;

  return (
    <SettingsContext.Provider value={{
      settings,
      academicYears,
      selectedYearId,
      setSelectedYearId,
      selectedYear,
      refreshSettings: refresh,
      loading
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

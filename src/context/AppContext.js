import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const DAILY_LIMIT_FREE = 20;

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('free'); // free, pro, premium
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    try {
      const stored = await AsyncStorage.getItem('appState');
      if (stored) {
        const state = JSON.parse(stored);
        const today = new Date().toDateString();
        // Reset daily messages if new day
        if (state.lastResetDate !== today) {
          state.messagesUsed = 0;
          state.lastResetDate = today;
        }
        setPlan(state.plan || 'free');
        setMessagesUsed(state.messagesUsed || 0);
        setLastResetDate(state.lastResetDate || today);
        setFavorites(state.favorites || []);
        setUser(state.user || null);
      } else {
        const today = new Date().toDateString();
        setLastResetDate(today);
      }
    } catch (e) {}
  }

  async function saveState(updates) {
    try {
      const current = { plan, messagesUsed, lastResetDate, favorites, user, ...updates };
      await AsyncStorage.setItem('appState', JSON.stringify(current));
    } catch (e) {}
  }

  function canSendMessage() {
    if (plan !== 'free') return true;
    return messagesUsed < DAILY_LIMIT_FREE;
  }

  function getRemainingMessages() {
    if (plan !== 'free') return 999;
    return Math.max(0, DAILY_LIMIT_FREE - messagesUsed);
  }

  async function incrementMessages() {
    const newCount = messagesUsed + 1;
    setMessagesUsed(newCount);
    await saveState({ messagesUsed: newCount });
  }

  function canAccessCharacter(tier) {
    if (tier === 'free') return true;
    if (tier === 'pro') return plan === 'pro' || plan === 'premium';
    if (tier === 'premium') return plan === 'premium';
    return false;
  }

  async function toggleFavorite(characterId) {
    const newFavs = favorites.includes(characterId)
      ? favorites.filter(f => f !== characterId)
      : [...favorites, characterId];
    setFavorites(newFavs);
    await saveState({ favorites: newFavs });
  }

  // Simulate upgrade (replace with Stripe later)
  async function upgradePlan(newPlan) {
    setPlan(newPlan);
    await saveState({ plan: newPlan });
  }

  return (
    <AppContext.Provider value={{
      user, plan, messagesUsed, favorites,
      canSendMessage, getRemainingMessages, incrementMessages,
      canAccessCharacter, toggleFavorite, upgradePlan,
      DAILY_LIMIT_FREE,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

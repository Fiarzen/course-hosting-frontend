import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { enrollmentApi } from '../api/api';

export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

const LeavesCollectedContext = createContext(null);

export const useLeavesCollected = () => {
  const context = useContext(LeavesCollectedContext);
  if (!context) {
    throw new Error('useLeavesCollected must be used within a LeavesCollectedProvider');
  }
  return context;
};

const storageKey = (email) => `leavesCollected_${email}`;

const readStored = (key) => {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        leavesCollected: Number(parsed.leavesCollected) || 0,
        seenMilestones: Array.isArray(parsed.seenMilestones) ? parsed.seenMilestones : [],
      };
    }
  } catch (err) {
    window.localStorage.removeItem(key);
  }
  return { leavesCollected: 0, seenMilestones: [] };
};

export const LeavesCollectedProvider = ({ children }) => {
  const { user } = useAuth();
  const [leavesCollected, setLeavesCollected] = useState(0);
  const [celebratingMilestone, setCelebratingMilestone] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?.email) return;
    const key = storageKey(user.email);
    try {
      const enrollments = await enrollmentApi.getMyCourses();
      const currentTotal = enrollments.reduce((s, e) => s + (e.completedLessons || 0), 0);
      const stored = readStored(key);
      // Ratchet: the lifetime count never decreases, even if the user
      // unenrolls from a course they had finished.
      const total = Math.max(stored.leavesCollected || 0, currentTotal);
      const crossed = MILESTONES.filter((m) => total >= m && !stored.seenMilestones.includes(m));
      const seenMilestones = crossed.length > 0
        ? [...stored.seenMilestones, ...crossed]
        : stored.seenMilestones;
      window.localStorage.setItem(key, JSON.stringify({ leavesCollected: total, seenMilestones }));
      setLeavesCollected(total);
      if (crossed.length > 0) {
        setCelebratingMilestone(crossed[crossed.length - 1]);
      }
    } catch (err) {
      console.error('Failed to refresh leaves collected:', err);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      refresh();
    } else {
      setLeavesCollected(0);
      setCelebratingMilestone(null);
    }
  }, [user?.email, refresh]);

  const dismissCelebration = () => setCelebratingMilestone(null);

  const value = {
    leavesCollected,
    celebratingMilestone,
    dismissCelebration,
    refresh,
  };

  return <LeavesCollectedContext.Provider value={value}>{children}</LeavesCollectedContext.Provider>;
};

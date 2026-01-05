import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './use-auth';
import {
  trackPageView,
  trackEvent,
  trackButtonClick,
  trackMission,
  trackMedication,
  trackCheckin,
  trackAIChat,
  trackActivity,
  trackQuestionnaire,
  trackGamification,
  trackModal,
  trackOnboarding,
  trackAuth,
  trackError,
  trackNavigation,
  identifyUser,
  setUserProperties,
  ClarityEvents,
  type ClarityEventName,
} from '@/lib/clarity';

export function useClarity() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const pageName = location === '/' ? 'home' : location.slice(1).replace(/\//g, '_');
    trackPageView(pageName);
  }, [location]);

  useEffect(() => {
    if (user?.id) {
      identifyUser(String(user.id), {
        username: user.username,
      });
    }
  }, [user?.id, user?.username]);

  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackMission,
    trackMedication,
    trackCheckin,
    trackAIChat,
    trackActivity,
    trackQuestionnaire,
    trackGamification,
    trackModal,
    trackOnboarding,
    trackAuth,
    trackError,
    trackNavigation,
    identifyUser,
    setUserProperties,
    ClarityEvents,
  };
}

export function useClarityPageView(pageName: string) {
  useEffect(() => {
    trackPageView(pageName);
  }, [pageName]);
}

export function useClarityIdentify() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.id) {
      identifyUser(String(user.id), {
        username: user.username,
      });
    }
  }, [user?.id, user?.username]);
}

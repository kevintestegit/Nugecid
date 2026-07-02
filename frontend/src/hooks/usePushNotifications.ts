import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { pushSubscriptionService } from "@/services/pushSubscriptionService";
import type { NotificationPreferences } from "@/types";
import { PREFERENCES_UPDATED_EVENT } from "./useDesktopNotifications";

interface PreferencesUpdatedEventDetail {
  preferences?: NotificationPreferences | null;
}

export const usePushNotifications = () => {
  const { user } = useAuth();

  const syncFromPreferences = useCallback(
    async (preferences?: NotificationPreferences | null) => {
      if (!user || !pushSubscriptionService.isSupported()) {
        return;
      }

      if (!preferences?.pushEnabled || Notification.permission !== "granted") {
        await pushSubscriptionService.detachCurrentSubscription();
        return;
      }

      await pushSubscriptionService.ensureRegisteredWithServer();
    },
    [user],
  );

  const loadAndSyncPreferences = useCallback(async () => {
    if (!user || !pushSubscriptionService.isSupported()) {
      return;
    }

    try {
      const response = await apiService.getNotificationPreferences();
      if (response.success && response.data) {
        await syncFromPreferences(response.data);
      }
    } catch {
      // Silent: push sync should not disturb the main app flow.
    }
  }, [syncFromPreferences, user]);

  useEffect(() => {
    void loadAndSyncPreferences();
  }, [loadAndSyncPreferences]);

  useEffect(() => {
    if (!user || !pushSubscriptionService.isSupported()) {
      return;
    }

    const handlePreferencesUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<PreferencesUpdatedEventDetail>;
      void syncFromPreferences(customEvent.detail?.preferences ?? null);
    };

    window.addEventListener(
      PREFERENCES_UPDATED_EVENT,
      handlePreferencesUpdated,
    );
    return () => {
      window.removeEventListener(
        PREFERENCES_UPDATED_EVENT,
        handlePreferencesUpdated,
      );
    };
  }, [syncFromPreferences, user]);
};

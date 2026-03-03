import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { desktopNotificationsService } from "@/services/desktopNotificationsService";
import type { Notificacao } from "@/services/notificacoesService";
import { useNotificacoesStore } from "@/store/notificacoesStore";
import type { NotificationPreferences } from "@/types";
import { getNotificationDestination } from "@/utils/notificationNavigation";

const PREFERENCES_UPDATED_EVENT = "sgc:notification-preferences-updated";
const MAX_TRACKED_NOTIFICATIONS = 100;

interface PreferencesUpdatedEventDetail {
  preferences?: NotificationPreferences | null;
}

export const useDesktopNotifications = () => {
  const navigate = useNavigate();
  const latestRealtimeNotification = useNotificacoesStore(
    (state) => state.latestRealtimeNotification,
  );
  const desktopEnabledRef = useRef(false);
  const displayedNotificationIdsRef = useRef<number[]>([]);

  const applyPreferences = useCallback(
    (preferences?: NotificationPreferences | null) => {
      desktopEnabledRef.current = Boolean(preferences?.desktopEnabled);
    },
    [],
  );

  const syncPreferences = useCallback(async () => {
    try {
      const response = await apiService.getNotificationPreferences();
      if (response.success && response.data) {
        applyPreferences(response.data);
      }
    } catch {
      // Silent: desktop notifications should fail closed.
    }
  }, [applyPreferences]);

  const markAsDisplayed = useCallback((notificationId: number) => {
    if (displayedNotificationIdsRef.current.includes(notificationId)) {
      return false;
    }

    displayedNotificationIdsRef.current.unshift(notificationId);
    if (
      displayedNotificationIdsRef.current.length > MAX_TRACKED_NOTIFICATIONS
    ) {
      displayedNotificationIdsRef.current.length = MAX_TRACKED_NOTIFICATIONS;
    }

    return true;
  }, []);

  const showDesktopNotification = useCallback(
    (notificacao?: Notificacao) => {
      if (!desktopEnabledRef.current) {
        return;
      }

      if (desktopNotificationsService.getPermission() !== "granted") {
        return;
      }

      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        return;
      }

      if (!notificacao || !markAsDisplayed(notificacao.id)) {
        return;
      }

      const destination = getNotificationDestination(notificacao);

      desktopNotificationsService.show(notificacao, {
        onClick: () => {
          if (destination) {
            navigate(destination);
          }
        },
      });
    },
    [markAsDisplayed, navigate],
  );

  useEffect(() => {
    void syncPreferences();
  }, [syncPreferences]);

  useEffect(() => {
    const handlePreferencesUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<PreferencesUpdatedEventDetail>;
      applyPreferences(customEvent.detail?.preferences ?? null);
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
  }, [applyPreferences]);

  useEffect(() => {
    if (!latestRealtimeNotification) {
      return;
    }

    showDesktopNotification(latestRealtimeNotification);
  }, [latestRealtimeNotification, showDesktopNotification]);
};

export { PREFERENCES_UPDATED_EVENT };

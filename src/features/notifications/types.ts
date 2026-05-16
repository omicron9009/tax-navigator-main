// src/features/notifications/types.ts

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_client_id?: string | null;
  user_name?: string; // Included based on our previous UI discussion
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
}

export interface NotificationsListProps {
  initialData: NotificationsResponse;
  activeFilters: {
    page: number;
    unreadOnly: boolean;
  };
}

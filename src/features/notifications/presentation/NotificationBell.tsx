"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { type Notification } from "../domain/notification";
import { FirestoreNotificationRepository } from "../infrastructure/persistence/firestore-notification-repository";

export function NotificationBell() {
  const user = useUser();
  const db = useFirestore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || !db) return;

    const repository = new FirestoreNotificationRepository(db);

    // Subscribe to real-time notifications
    const unsubscribe = repository.subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user, db]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user || !db) return;

    const repository = new FirestoreNotificationRepository(db);
    await repository.markAsRead(user.uid, notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !db) return;

    const repository = new FirestoreNotificationRepository(db);
    await repository.markAllAsRead(user.uid);
  };

  const handleDelete = async (notificationId: string) => {
    if (!user || !db) return;

    const repository = new FirestoreNotificationRepository(db);
    await repository.deleteNotification(user.uid, notificationId);
  };

  const handleClearAll = async () => {
    if (!user || !db) return;

    const repository = new FirestoreNotificationRepository(db);
    await repository.deleteAll(user.uid);
  };

  const formatCreatedAt = (createdAt: Date | Timestamp) => {
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : createdAt;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-2 py-3 border-b last:border-0 hover:bg-accent cursor-pointer transition-colors ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.read && (
                        <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                      )}
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCreatedAt(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  initiateGoogleOAuth,
  disconnectGoogleAccount,
  checkGoogleTasksConnection,
} from "@/features/auth/presentation/actions/oauth-actions";
import { syncGoogleTasks } from "@/features/tasks/presentation/actions/sync-actions";

interface ConnectionStatus {
  isConnected: boolean;
  email?: string;
  connectedAt?: Date;
  lastSyncedAt?: Date;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  // Load connection status when user is available
  useEffect(() => {
    if (!isUserLoading && user) {
      loadConnectionStatus();
    }
  }, [user, isUserLoading]);

  const loadConnectionStatus = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await checkGoogleTasksConnection(user.uid);

      if (result.success && result.isConnected) {
        setConnectionStatus({
          isConnected: true,
          email: result.email,
          connectedAt: result.connectedAt,
          lastSyncedAt: result.lastSyncedAt,
        });
      } else {
        setConnectionStatus({
          isConnected: false,
        });
      }
    } catch (error) {
      console.error("Error loading connection status:", error);
      toast({
        title: "Error",
        description: "Failed to load connection status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    try {
      const result = await initiateGoogleOAuth(user.uid);

      if (result.success && result.authUrl) {
        // Redirect to Google OAuth page
        window.location.href = result.authUrl;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to initiate OAuth",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting Google Tasks:", error);
      toast({
        title: "Error",
        description: "Failed to connect Google Tasks",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const result = await disconnectGoogleAccount(user.uid);

      if (result.success) {
        setConnectionStatus({
          isConnected: false,
        });
        toast({
          title: "Success",
          description: "Google Tasks disconnected successfully",
        });
        setShowDisconnectDialog(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to disconnect",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error disconnecting Google Tasks:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Tasks",
        variant: "destructive",
      });
    }
  };

  const handleSyncNow = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const result = await syncGoogleTasks(user.uid);

      if (result.success && result.result) {
        toast({
          title: "Sync Complete",
          description: `Pulled: ${result.result.pulled}, Pushed: ${result.result.pushed}, Conflicts: ${result.result.conflicts}`,
        });

        // Reload connection status to update last sync time
        await loadConnectionStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync tasks",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing tasks:", error);
      toast({
        title: "Error",
        description: "Failed to sync tasks",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  // Show loading while checking auth or fetching connection status
  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your external task management platforms to sync tasks automatically
        </p>
      </div>

      {/* Google Tasks Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <CardTitle>Google Tasks</CardTitle>
                <CardDescription>
                  Sync your tasks with Google Tasks
                </CardDescription>
              </div>
            </div>
            <Badge variant={connectionStatus.isConnected ? "default" : "secondary"}>
              {connectionStatus.isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionStatus.isConnected ? (
            <>
              {/* Connection Details */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                {connectionStatus.email && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account:</span>
                    <span className="text-sm font-medium">{connectionStatus.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Connected:</span>
                  <span className="text-sm">{formatDate(connectionStatus.connectedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Synced:</span>
                  <span className="text-sm">{formatDate(connectionStatus.lastSyncedAt)}</span>
                </div>
              </div>

              {/* Sync Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Automatic Sync:</strong> Tasks are automatically synced every 3 minutes.
                  You can also manually trigger a sync below.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex-1"
                >
                  {isSyncing ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    "Sync Now"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisconnectDialog(true)}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not Connected Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Connect your Google Tasks account to sync tasks automatically.
                  Changes made in either platform will be reflected in both directions.
                </p>
              </div>

              <Button onClick={handleConnect} className="w-full">
                Connect Google Tasks
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon - Other Integrations */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Coming Soon</h2>

        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xl">N</span>
                </div>
                <div>
                  <CardTitle>Notion</CardTitle>
                  <CardDescription>Sync with Notion databases</CardDescription>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xl">A</span>
                </div>
                <div>
                  <CardTitle>Asana</CardTitle>
                  <CardDescription>Sync with Asana projects</CardDescription>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop automatic syncing with Google Tasks. Your existing tasks
              will remain in your local library, but changes will no longer be synced.
              You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

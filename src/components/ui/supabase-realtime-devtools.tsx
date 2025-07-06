"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
  Radio,
  Database,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  WifiOff,
  Play,
  Square,
  Send,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Switch } from "./switch";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface LogEntry {
  id: number;
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  source?: "self" | "external" | "system";
  message: string;
  details?: any;
  isExpanded?: boolean;
}

interface SupabaseDevToolsProps {
  supabaseClient?: any;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  defaultChannel?: string;
  maxLogs?: number;
  enableKeyboardShortcut?: boolean;
  keyboardShortcut?: string;
}

interface DevToolsConfig {
  channelName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  error?: string;
  lastChecked: number;
}

interface BroadcastPayload {
  event: string;
  payload: any;
}

const STORAGE_KEY = "supabase-devtools-config";
const AUTH_CHECK_INTERVAL = 30000; // 30 seconds

const SupabaseDevTools: React.FC<SupabaseDevToolsProps> = ({
  supabaseClient,
  position = "bottom-right",
  defaultChannel = "project-updates",
  maxLogs = 100,
  enableKeyboardShortcut = true,
  keyboardShortcut = "Ctrl+Shift+S",
}) => {
  const supabase =
    supabaseClient || (typeof window !== "undefined" ? window : null);
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    lastChecked: 0,
  });

  // Monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSelfHosted, setIsSelfHosted] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<DevToolsConfig>(() => {
    if (typeof window === "undefined") {
      return { channelName: "project-updates" };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          channelName: parsed.channelName || "project-updates",
        };
      }
    } catch (error) {
      console.warn("Failed to parse devtools config from localStorage:", error);
    }

    return { channelName: "project-updates" };
  });

  // Refs for cleanup and state management
  const monitorChannelRef = useRef<any>(null);
  const authCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logIdCounterRef = useRef(0);
  const mountedRef = useRef(true);

  // Memoized error state
  const hasAuthError = useMemo(() => {
    return !authState.isAuthenticated && authState.error;
  }, [authState.isAuthenticated, authState.error]);

  // Update config and localStorage
  const updateConfig = useCallback((updates: Partial<DevToolsConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };

      if (mountedRef.current && typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        } catch (error) {
          console.warn(
            "Failed to save devtools config to localStorage:",
            error
          );
        }
      }

      return newConfig;
    });
  }, []);

  // Optimized log management
  const addLog = useCallback(
    (
      type: LogEntry["type"],
      message: string,
      source?: LogEntry["source"],
      details?: any
    ) => {
      if (!mountedRef.current) return;

      logIdCounterRef.current += 1;
      const newLog: LogEntry = {
        id: logIdCounterRef.current,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        type,
        message,
        details,
        isExpanded: false,
      };

      setLogs((prev) => [newLog, ...prev].slice(0, maxLogs));
    },
    []
  );

  // Check Supabase authentication
  const checkAuth = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized");
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const isAuthenticated = !!session;

      setAuthState({
        isAuthenticated,
        error: isAuthenticated ? undefined : "No active session",
        lastChecked: Date.now(),
      });

      if (!isAuthenticated) {
        addLog("warning", "🔒 No active Supabase session detected", "system", {
          session: null,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Authentication check failed";

      setAuthState({
        isAuthenticated: false,
        error: errorMessage,
        lastChecked: Date.now(),
      });

      addLog("error", `🔴 Supabase auth failed: ${errorMessage}`, "system", {
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: new Date().toISOString(),
      });
    }
  }, [addLog]);

  // Track filtered message count for transparency
  const [filteredCount, setFilteredCount] = useState(0);

  // Start monitoring channel
  const startMonitoring = useCallback(() => {
    if (!mountedRef.current || !authState.isAuthenticated) {
      addLog("error", "Cannot start monitoring - not authenticated", "system");
      return;
    }

    if (!config.channelName.trim()) {
      addLog("error", "Please enter a channel name to monitor", "system");
      return;
    }

    // Clean up existing channel
    if (monitorChannelRef.current) {
      try {
        monitorChannelRef.current.unsubscribe();
      } catch (error) {
        console.warn("Error unsubscribing from channel:", error);
      }
      monitorChannelRef.current = null;
    }

    setIsMonitoring(true);
    setFilteredCount(0); // Reset filtered count when starting monitoring
    addLog(
      "success",
      `✅ Starting monitoring for ${config.channelName}`,
      "system"
    );

    const channel = supabase.channel(config.channelName);
    monitorChannelRef.current = channel;

    channel
      .on("broadcast", { event: "*" }, (payload: BroadcastPayload) => {
        if (!mountedRef.current) return;

        addLog(
          "success",
          `📻 Received broadcast on ${config.channelName}`,
          "external",
          {
            channel: config.channelName,
            event: payload.event,
            payload: payload.payload,
            timestamp: new Date().toISOString(),
          }
        );
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "*", table: "*" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (!mountedRef.current) return;

          addLog("success", `🗄️ Database change`, "external", {
            channel: config.channelName,
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (!mountedRef.current) return;

        if (err) {
          addLog("error", `❌ Subscription error: ${err.message}`, "system", {
            channel: config.channelName,
            error: err,
          });
          setIsMonitoring(false);
        } else {
          addLog("info", `📡 Subscription status: ${status}`, "system", {
            channel: config.channelName,
            status,
          });

          if (status === "SUBSCRIBED") {
            addLog(
              "success",
              `✅ Successfully monitoring ${config.channelName}`
            );
          } else if (status === "CHANNEL_ERROR") {
            setIsMonitoring(false);
          }
        }
      });
  }, [config.channelName, authState.isAuthenticated, addLog]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitorChannelRef.current) {
      try {
        monitorChannelRef.current.unsubscribe();
        addLog("info", `⏹️ Stopped monitoring ${config.channelName}`, "system");
      } catch (error) {
        addLog("warning", `⚠️ Error stopping monitoring: ${error}`, "system");
      }
      monitorChannelRef.current = null;
    }

    setIsMonitoring(false);
    setIsSelfHosted(false);
  }, [config.channelName, addLog]);

  // Self-broadcast (when toggle is ON)
  const sendSelfBroadcast = useCallback(() => {
    if (!mountedRef.current || !authState.isAuthenticated || !isMonitoring) {
      addLog(
        "warning",
        "Cannot send broadcast: not authenticated or monitoring",
        "system"
      );
      return;
    }

    const testPayload = {
      message: "DevTools self-broadcast",
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substr(2, 9),
      mode: "self-hosted",
    };

    try {
      const channel = supabase.channel(config.channelName);

      channel
        .send({
          type: "broadcast",
          event: "devtools-self-broadcast",
          payload: testPayload,
        })
        .then(() => {
          if (!mountedRef.current) return;
          addLog("success", `📡 Self-broadcast sent`, "self", {
            payload: testPayload,
            channel: config.channelName,
            mode: "self-hosted",
          });
        })
        .catch((error: Error) => {
          if (!mountedRef.current) return;
          addLog(
            "error",
            `❌ Self-broadcast failed: ${error.message}`,
            "system",
            {
              error,
              channel: config.channelName,
            }
          );
        });
    } catch (error: any) {
      addLog(
        "error",
        `❌ Self-broadcast setup failed: ${error?.message || "Unknown error"}`,
        "system",
        {
          error:
            error instanceof Error
              ? error
              : new Error(error?.message || "Unknown error"),
          channel: config.channelName,
        }
      );
    }
  }, [config.channelName, authState.isAuthenticated, isMonitoring, addLog]);

  // Toggle self-hosted mode
  const toggleSelfHosted = useCallback(
    (checked: boolean) => {
      if (!isMonitoring) {
        addLog("warning", "Start monitoring first before changing mode");
        return;
      }

      setIsSelfHosted(checked);
      addLog(
        "info",
        `🔄 Switched to ${checked ? "self-hosted" : "listener"} mode`
      );
    },
    [isMonitoring, addLog]
  );

  // Utility functions
  const toggleLogDetails = useCallback((logId: number) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, isExpanded: !log.isExpanded } : log
      )
    );
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logIdCounterRef.current = 0;
    // Don't add log message when clearing - per requirement
  }, []);

  const handleChannelNameChange = useCallback(
    (value: string) => {
      updateConfig({ channelName: value });
    },
    [updateConfig]
  );

  // Effects
  useEffect(() => {
    mountedRef.current = true;

    // Initial auth check
    checkAuth();

    // Set up auth check interval
    authCheckIntervalRef.current = setInterval(checkAuth, AUTH_CHECK_INTERVAL);

    return () => {
      mountedRef.current = false;

      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
    };
  }, [checkAuth]);

  useEffect(() => {
    if (!authState.isAuthenticated && isMonitoring) {
      // Stop monitoring if auth is lost
      stopMonitoring();
    }
  }, [authState.isAuthenticated, isMonitoring, stopMonitoring]);

  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse keyboard shortcut (default: Ctrl+Shift+S)
      const parts = keyboardShortcut.toLowerCase().split("+");
      const hasCtrl = parts.includes("ctrl") && e.ctrlKey;
      const hasShift = parts.includes("shift") && e.shiftKey;
      const hasAlt = parts.includes("alt") && e.altKey;
      const key = parts[parts.length - 1];

      if (hasCtrl && hasShift && e.key.toLowerCase() === key && !hasAlt) {
        e.preventDefault();
        if (hasAuthError) return; // Don't allow toggle when there's an error
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAuthError, enableKeyboardShortcut, keyboardShortcut]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      // Clean up channel subscription
      if (monitorChannelRef.current) {
        try {
          monitorChannelRef.current.unsubscribe();
        } catch (error) {
          console.warn("Error during cleanup:", error);
        }
        monitorChannelRef.current = null;
      }

      // Clean up auth check interval
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Memoized computed values
  const statusColor = useMemo(() => {
    if (hasAuthError) return "text-red-500";
    if (authState.isAuthenticated && isMonitoring) return "text-green-500";
    return "text-muted-foreground";
  }, [hasAuthError, authState.isAuthenticated, isMonitoring]);

  const indicatorColor = useMemo(() => {
    if (hasAuthError) return "bg-red-500";
    if (authState.isAuthenticated && isMonitoring) return "bg-green-500";
    return "bg-muted-foreground";
  }, [hasAuthError, authState.isAuthenticated, isMonitoring]);

  const getLogIcon = useCallback((type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  }, []);

  const getSourceBadge = useCallback((source: LogEntry["source"]) => {
    switch (source) {
      case "self":
        return (
          <Badge
            variant="default"
            className="text-xs bg-blue-100 text-blue-800"
          >
            Self
          </Badge>
        );
      case "external":
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-green-100 text-green-800"
          >
            External
          </Badge>
        );
      case "system":
        return (
          <Badge variant="outline" className="text-xs">
            System
          </Badge>
        );
      default:
        return null;
    }
  }, []);

  // Position classes
  const positionClasses = useMemo(() => {
    switch (position) {
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      default:
        return "bottom-4 right-4";
    }
  }, [position]);

  const panelPositionClasses = useMemo(() => {
    switch (position) {
      case "bottom-left":
        return "bottom-0 left-0 rounded-tr-xl border-r-0 border-b-0 border-l-0";
      case "top-right":
        return "top-0 right-0 rounded-bl-xl border-l-0 border-t-0 border-r-0";
      case "top-left":
        return "top-0 left-0 rounded-br-xl border-r-0 border-t-0 border-l-0";
      default:
        return "bottom-0 right-0 rounded-tl-xl border-l-0 border-b-0 border-r-0";
    }
  }, [position]);

  if (!isOpen) {
    return (
      <div
        onClick={() => !hasAuthError && setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 group",
          hasAuthError && "cursor-not-allowed"
        )}
        title={
          hasAuthError
            ? `Supabase DevTools - Error: ${authState.error}`
            : "Open Supabase DevTools (Ctrl+Shift+S)"
        }
      >
        <div
          className={cn(
            "bg-background border border-border p-3 rounded-lg shadow-lg transition-all duration-300",
            hasAuthError
              ? "border-red-500 bg-red-50"
              : "cursor-pointer hover:shadow-xl transform hover:scale-105"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={cn("w-3 h-3 rounded-full", indicatorColor)}></div>
              {isMonitoring && !hasAuthError && (
                <div
                  className={cn(
                    "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75",
                    indicatorColor
                  )}
                ></div>
              )}
            </div>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                hasAuthError ? "text-red-600" : "text-foreground"
              )}
            >
              {hasAuthError ? "Auth Error" : "Supabase"}
            </span>
            {hasAuthError && <WifiOff className="w-4 h-4 text-red-500" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-[450px] h-screen">
      <Card className="h-full w-full border-l-0 border-b-0 border-r-0 rounded-none rounded-tl-xl bg-background/95 backdrop-blur-sm border-border shadow-2xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="relative">
                <div
                  className={cn("w-3 h-3 rounded-full", indicatorColor)}
                ></div>
                {isMonitoring && !hasAuthError && (
                  <div
                    className={cn(
                      "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75",
                      indicatorColor
                    )}
                  ></div>
                )}
              </div>
              <span className="font-mono font-semibold">Supabase DevTools</span>
              <Badge variant="outline" className="text-xs">
                v2.1
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-[calc(100vh-80px)] flex flex-col">
          {hasAuthError && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">
                  Authentication Error
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1">{authState.error}</p>
            </div>
          )}

          {/* Channel Input and Monitor Controls */}
          <div
            className={cn(
              "p-4 border-b bg-muted/30",
              hasAuthError && "opacity-50"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Channel Monitor</h3>
              </div>

              <div className="flex gap-2">
                <Input
                  value={config.channelName}
                  onChange={(e) => handleChannelNameChange(e.target.value)}
                  placeholder="Enter channel name..."
                  disabled={isMonitoring || !!hasAuthError}
                  className="flex-1 h-9 text-sm"
                />
                {!isMonitoring ? (
                  <Button
                    onClick={startMonitoring}
                    disabled={!config.channelName.trim() || !!hasAuthError}
                    size="sm"
                    className="h-9 px-3"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Monitor
                  </Button>
                ) : (
                  <Button
                    onClick={stopMonitoring}
                    variant="destructive"
                    size="sm"
                    className="h-9 px-3"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>

              {isMonitoring && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-medium">
                      Monitoring: {config.channelName}
                    </span>
                  </div>

                  {/* Toggle Mode */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {isSelfHosted ? "Self-Hosted Mode" : "Listener Mode"}
                      </span>
                      <Badge
                        variant={isSelfHosted ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isSelfHosted ? "Broadcasting" : "Receiving"}
                      </Badge>
                    </div>
                    <Switch
                      checked={isSelfHosted}
                      onCheckedChange={toggleSelfHosted}
                      disabled={!!hasAuthError}
                    />
                  </div>

                  {/* Broadcast Button - Only visible in self-hosted mode */}
                  {isSelfHosted && (
                    <Button
                      onClick={sendSelfBroadcast}
                      className="w-full h-9"
                      disabled={!!hasAuthError}
                    >
                      <Send className="w-3 h-3 mr-2" />
                      Send Broadcast
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div
            className={cn(
              "p-4 border-b bg-muted/30",
              hasAuthError && "opacity-50"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Status</h3>
                </div>
                <Badge variant="outline" className={cn("text-xs", statusColor)}>
                  {hasAuthError
                    ? "Auth Error"
                    : authState.isAuthenticated
                    ? isMonitoring
                      ? "Monitoring"
                      : "Ready"
                    : "Not Authenticated"}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                {isMonitoring
                  ? `${
                      isSelfHosted ? "Self-hosting" : "Listening for"
                    } messages on ${config.channelName}`
                  : "Enter channel name and click Monitor to start"}
              </div>
            </div>
          </div>

          {/* Logs Section */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Realtime Logs
                  <Badge variant="outline" className="ml-2 text-xs">
                    {logs.length}
                  </Badge>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Ctrl+Shift+S
                </Badge>
                <Button
                  onClick={clearLogs}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  disabled={!!hasAuthError}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Logs Display */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    No logs yet
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {hasAuthError
                      ? "Fix authentication to see logs"
                      : "Start monitoring to see realtime activity"}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {logs.map((log) => (
                    <Card
                      key={log.id}
                      className="overflow-hidden transition-all duration-200 hover:shadow-md"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            {getLogIcon(log.type)}
                            <div className="w-px h-4 bg-border last:hidden"></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {log.type}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {log.timestamp}
                                </div>
                              </div>
                              {log.details && (
                                <Button
                                  onClick={() => toggleLogDetails(log.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  {log.isExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>

                            <p className="text-sm text-foreground font-mono leading-relaxed">
                              {log.message}
                            </p>

                            {log.details && log.isExpanded && (
                              <div className="mt-3 p-3 bg-muted rounded-md border">
                                <div className="flex items-center gap-1 mb-2">
                                  <Database className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    DETAILS
                                  </span>
                                </div>
                                <ScrollArea className="max-h-40">
                                  <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseDevTools;

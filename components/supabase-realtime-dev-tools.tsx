import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Types
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

// Constants
const STORAGE_KEY = "supabase-devtools-config";
const AUTH_CHECK_INTERVAL = 30000;
const DEFAULT_CONFIG: DevToolsConfig = { channelName: "project-updates" };

// Custom Hooks (Single Responsibility)
const useStorageConfig = (initialConfig: DevToolsConfig) => {
  const [config, setConfig] = useState<DevToolsConfig>(() => {
    if (typeof window === "undefined") return initialConfig;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? { ...initialConfig, ...JSON.parse(stored) }
        : initialConfig;
    } catch (error) {
      console.warn("Failed to parse devtools config from localStorage:", error);
      return initialConfig;
    }
  });

  const updateConfig = useCallback((updates: Partial<DevToolsConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };

      if (typeof window !== "undefined") {
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

  return { config, updateConfig };
};

const useAuth = (supabaseClient: any) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    lastChecked: 0,
  });

  const checkAuth = useCallback(async () => {
    try {
      if (!supabaseClient) {
        throw new Error("Supabase client is not initialized");
      }

      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (error) throw error;

      const isAuthenticated = !!session;
      setAuthState({
        isAuthenticated,
        error: isAuthenticated ? undefined : "No active session",
        lastChecked: Date.now(),
      });
    } catch (error: any) {
      setAuthState({
        isAuthenticated: false,
        error: error?.message || "Authentication check failed",
        lastChecked: Date.now(),
      });
    }
  }, [supabaseClient]);

  return { authState, checkAuth };
};

const useLogs = (maxLogs: number) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounterRef = useRef(0);

  const addLog = useCallback(
    (
      type: LogEntry["type"],
      message: string,
      source?: LogEntry["source"],
      details?: any
    ) => {
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
        source,
        details,
        isExpanded: false,
      };

      setLogs((prev) => [newLog, ...prev].slice(0, maxLogs));
    },
    [maxLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    logIdCounterRef.current = 0;
  }, []);

  const toggleLogDetails = useCallback((logId: number) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, isExpanded: !log.isExpanded } : log
      )
    );
  }, []);

  return { logs, addLog, clearLogs, toggleLogDetails };
};

const useMonitoring = (
  supabaseClient: any,
  config: DevToolsConfig,
  authState: AuthState,
  addLog: (
    type: LogEntry["type"],
    message: string,
    source?: LogEntry["source"],
    details?: any
  ) => void
) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSelfHosted, setIsSelfHosted] = useState(false);
  const monitorChannelRef = useRef<any>(null);

  const startMonitoring = useCallback(() => {
    if (!authState.isAuthenticated) {
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
    }

    setIsMonitoring(true);
    addLog(
      "success",
      `✅ Starting monitoring for ${config.channelName}`,
      "system"
    );

    const channel = supabaseClient.channel(config.channelName);
    monitorChannelRef.current = channel;

    channel
      .on("broadcast", { event: "*" }, (payload: BroadcastPayload) => {
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
  }, [config.channelName, authState.isAuthenticated, addLog, supabaseClient]);

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

  const sendSelfBroadcast = useCallback(() => {
    if (!authState.isAuthenticated || !isMonitoring) {
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
      const channel = supabaseClient.channel(config.channelName);
      channel
        .send({
          type: "broadcast",
          event: "devtools-self-broadcast",
          payload: testPayload,
        })
        .then(() => {
          addLog("success", `📡 Self-broadcast sent`, "self", {
            payload: testPayload,
            channel: config.channelName,
            mode: "self-hosted",
          });
        })
        .catch((error: Error) => {
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
  }, [
    config.channelName,
    authState.isAuthenticated,
    isMonitoring,
    addLog,
    supabaseClient,
  ]);

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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (monitorChannelRef.current) {
        try {
          monitorChannelRef.current.unsubscribe();
        } catch (error) {
          console.warn("Error during cleanup:", error);
        }
      }
    };
  }, []);

  return {
    isMonitoring,
    isSelfHosted,
    startMonitoring,
    stopMonitoring,
    sendSelfBroadcast,
    toggleSelfHosted,
  };
};

// Utility Functions (DRY)
const getLogIcon = (type: LogEntry["type"]) => {
  const iconMap = {
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };
  return iconMap[type];
};

const getSourceBadge = (source: LogEntry["source"]) => {
  const badgeMap = {
    self: (
      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
        Self
      </Badge>
    ),
    external: (
      <Badge
        variant="secondary"
        className="text-xs bg-green-100 text-green-800"
      >
        External
      </Badge>
    ),
    system: (
      <Badge variant="outline" className="text-xs">
        System
      </Badge>
    ),
  };
  return source ? badgeMap[source] : null;
};

const getPositionClasses = (position: string) => {
  const positionMap = {
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };
  return (
    positionMap[position as keyof typeof positionMap] ||
    positionMap["bottom-right"]
  );
};

// UI Components (Single Responsibility)
const StatusIndicator: React.FC<{
  hasAuthError?: boolean;
  isAuthenticated: boolean;
  isMonitoring: boolean;
  authError?: string;
  onOpen: () => void;
}> = ({ hasAuthError, isAuthenticated, isMonitoring, authError, onOpen }) => {
  const indicatorColor = useMemo(() => {
    if (hasAuthError) return "bg-red-500";
    if (isAuthenticated && isMonitoring) return "bg-green-500";
    return "bg-muted-foreground";
  }, [hasAuthError, isAuthenticated, isMonitoring]);

  return (
    <div
      onClick={() => !hasAuthError && onOpen()}
      className={cn(
        "fixed bottom-4 right-4 z-50 group",
        hasAuthError && "cursor-not-allowed"
      )}
      title={
        hasAuthError
          ? `Supabase DevTools - Error: ${authError}`
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
};

const LogsSection: React.FC<{
  logs: LogEntry[];
  toggleLogDetails: (id: number) => void;
  clearLogs: () => void;
  hasAuthError: boolean;
}> = ({ logs, toggleLogDetails, clearLogs, hasAuthError }) => {
  if (logs.length === 0) {
    return (
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
    );
  }

  return (
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
                    <Badge variant="outline" className="text-xs capitalize">
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
  );
};

// Main Component
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
  const mountedRef = useRef(true);

  // Custom hooks
  const { config, updateConfig } = useStorageConfig({
    channelName: defaultChannel,
  });
  const { authState, checkAuth } = useAuth(supabase);
  const { logs, addLog, clearLogs, toggleLogDetails } = useLogs(maxLogs);
  const {
    isMonitoring,
    isSelfHosted,
    startMonitoring,
    stopMonitoring,
    sendSelfBroadcast,
    toggleSelfHosted,
  } = useMonitoring(supabase, config, authState, addLog);

  // Computed values
  const hasAuthError: any = useMemo(() => {
    return !authState.isAuthenticated && authState.error;
  }, [authState.isAuthenticated, authState.error]);

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

  // Effects
  useEffect(() => {
    mountedRef.current = true;
    checkAuth();

    const authCheckInterval = setInterval(checkAuth, AUTH_CHECK_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(authCheckInterval);
    };
  }, [checkAuth]);

  useEffect(() => {
    if (!authState.isAuthenticated && isMonitoring) {
      stopMonitoring();
    }
  }, [authState.isAuthenticated, isMonitoring, stopMonitoring]);

  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const parts = keyboardShortcut.toLowerCase().split("+");
      const hasCtrl = parts.includes("ctrl") && e.ctrlKey;
      const hasShift = parts.includes("shift") && e.shiftKey;
      const hasAlt = parts.includes("alt") && e.altKey;
      const key = parts[parts.length - 1];

      if (hasCtrl && hasShift && e.key.toLowerCase() === key && !hasAlt) {
        e.preventDefault();
        if (hasAuthError) return;
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAuthError, enableKeyboardShortcut, keyboardShortcut]);

  if (!isOpen) {
    return (
      <StatusIndicator
        hasAuthError={hasAuthError}
        isAuthenticated={authState.isAuthenticated}
        isMonitoring={isMonitoring}
        authError={authState.error}
        onOpen={() => setIsOpen(true)}
      />
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
                  onChange={(e) =>
                    updateConfig({ channelName: e.target.value })
                  }
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
              <LogsSection
                logs={logs}
                toggleLogDetails={toggleLogDetails}
                clearLogs={clearLogs}
                hasAuthError={hasAuthError}
              />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseDevTools;

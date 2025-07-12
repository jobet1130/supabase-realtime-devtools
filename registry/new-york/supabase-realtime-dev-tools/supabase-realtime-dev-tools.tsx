import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  useReducer,
  memo,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Activity,
  Settings,
  Monitor,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// TYPES & INTERFACES - STRICT TYPESCRIPT
// ============================================================================

interface SupabaseSession {
  access_token: string;
  user: { id: string };
}

interface AuthResponse {
  data: { session: SupabaseSession | null };
  error?: Error;
}

interface RealtimeChannel {
  subscribe(callback: (status: string, error?: Error) => void): RealtimeChannel;
  unsubscribe(): void;
  on(
    event: string,
    config: any,
    callback: (payload: any) => void
  ): RealtimeChannel;
  send(payload: { type: string; event: string; payload: any }): Promise<void>;
}

interface SupabaseClient {
  channel(name: string): RealtimeChannel;
  auth: {
    getSession(): Promise<AuthResponse>;
  };
}

interface LogEntry {
  readonly id: number;
  readonly timestamp: string;
  readonly type: "info" | "success" | "error" | "warning";
  readonly source: "broadcast" | "database" | "presence" | "system" | "self";
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly channelName: string;
  readonly event?: string;
}

interface DevToolsConfig {
  readonly channelName: string;
  readonly enableBroadcast: boolean;
  readonly enableDatabase: boolean;
  readonly enablePresence: boolean;
  readonly enableSelfTestBroadcast: boolean;
  readonly showSystemLogs: boolean;
  readonly maxLogs: number;
  readonly autoScroll: boolean;
}

interface ConnectionStats {
  readonly isConnected: boolean;
  readonly totalMessages: number;
  readonly lastActivity: Date | null;
  readonly uptime: number;
  readonly messageTypes: {
    readonly broadcast: number;
    readonly database: number;
    readonly presence: number;
    readonly system: number;
  };
}

interface DevToolsState {
  readonly logs: readonly LogEntry[];
  readonly stats: ConnectionStats;
  readonly expandedLogs: ReadonlySet<number>;
  readonly isMonitoring: boolean;
  readonly isAuthenticated: boolean;
  readonly authError: string | null;
}

interface SupabaseDevToolsProps {
  readonly client?: unknown | SupabaseClient;
  readonly position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  readonly defaultChannel?: string;
  readonly enableKeyboardShortcut?: boolean;
  readonly keyboardShortcut?: string;
  readonly autoShow?: boolean;
  readonly maxLogs?: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  info: {
    title: "Supabase DevTools",
    version: "1.0",
  },
  settings: {
    eventListeners: {
      title: "Event Listeners",
    },
  },
  status: {
    authError: {
      text: "Auth Error",
      color: "text-red-500",
      bgColor: "bg-red-500",
    },
    connected: {
      text: "Connected",
      color: "text-green-500",
      bgColor: "bg-green-500",
    },
    disconnected: {
      text: "Disconnected",
      color: "text-red-500",
      bgColor: "bg-red-500",
    },
    monitoring: {
      text: "Monitoring",
      color: "text-green-500",
      bgColor: "bg-green-500",
    },
  },
};

// ============================================================================
// ACTIONS & REDUCER - PERFORMANCE OPTIMIZED
// ============================================================================

type DevToolsAction =
  | {
      type: "ADD_LOG";
      payload: Omit<LogEntry, "id" | "timestamp" | "channelName">;
    }
  | { type: "CLEAR_LOGS" }
  | { type: "TOGGLE_LOG_DETAILS"; payload: number }
  | { type: "SET_MONITORING"; payload: boolean }
  | {
      type: "SET_AUTH_STATE";
      payload: { isAuthenticated: boolean; authError: string | null };
    }
  | { type: "UPDATE_STATS"; payload: Partial<ConnectionStats> };

let logIdCounter = 0;

const devToolsReducer = (
  state: DevToolsState,
  action: DevToolsAction
): DevToolsState => {
  switch (action.type) {
    case "ADD_LOG": {
      logIdCounter += 1;
      const newLog: LogEntry = {
        ...action.payload,
        id: logIdCounter,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
        }),
        channelName: state.stats.isConnected ? "connected" : "disconnected",
      };

      const newStats: ConnectionStats = {
        ...state.stats,
        totalMessages: state.stats.totalMessages + 1,
        lastActivity: new Date(),
        messageTypes: {
          ...state.stats.messageTypes,
          [action.payload.source]:
            state.stats.messageTypes[
              action.payload.source as keyof ConnectionStats["messageTypes"]
            ] + 1,
        },
      };

      return {
        ...state,
        logs: [newLog, ...state.logs].slice(0, 200) as readonly LogEntry[],
        stats: newStats,
      };
    }

    case "CLEAR_LOGS":
      return {
        ...state,
        logs: [],
        expandedLogs: new Set(),
        stats: {
          ...state.stats,
          totalMessages: 0,
          messageTypes: { broadcast: 0, database: 0, presence: 0, system: 0 },
        },
      };

    case "TOGGLE_LOG_DETAILS":
      const newExpanded = new Set(state.expandedLogs);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedLogs: newExpanded };

    case "SET_MONITORING":
      return { ...state, isMonitoring: action.payload };

    case "SET_AUTH_STATE":
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        authError: action.payload.authError,
      };

    case "UPDATE_STATS":
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };

    default:
      return state;
  }
};

// ============================================================================
// UTILITY FUNCTIONS - PURE & MEMOIZED
// ============================================================================

const STORAGE_KEY = "supabase-devtools-config";
const DEFAULT_CONFIG: DevToolsConfig = {
  channelName: "devtools-monitor",
  enableBroadcast: true,
  enableDatabase: true,
  enablePresence: true,
  enableSelfTestBroadcast: false,
  showSystemLogs: true,
  maxLogs: 200,
  autoScroll: true,
};

const createInitialState = (): DevToolsState => ({
  logs: [],
  stats: {
    isConnected: false,
    totalMessages: 0,
    lastActivity: null,
    uptime: 0,
    messageTypes: { broadcast: 0, database: 0, presence: 0, system: 0 },
  },
  expandedLogs: new Set(),
  isMonitoring: false,
  isAuthenticated: false,
  authError: null,
});

const loadConfig = (defaultChannel: string): DevToolsConfig => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONFIG, channelName: defaultChannel };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        channelName: parsed.channelName || defaultChannel,
      };
    }
  } catch (error) {
    console.warn("SupabaseDevTools: Failed to parse config", error);
  }

  return { ...DEFAULT_CONFIG, channelName: defaultChannel };
};

const saveConfig = (config: DevToolsConfig): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("SupabaseDevTools: Failed to save config", error);
  }
};

const getSupabaseClient = (
  injectedClient?: SupabaseClient
): SupabaseClient | null => {
  if (injectedClient) return injectedClient;

  if (typeof window !== "undefined") {
    const windowAny = window as any;
    return windowAny.supabase || windowAny.__supabase || null;
  }

  return null;
};

const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

// ============================================================================
// MEMOIZED COMPONENTS - PREVENT UNNECESSARY RE-RENDERS
// ============================================================================

interface LogEntryProps {
  readonly log: LogEntry;
  readonly isExpanded: boolean;
  readonly onToggleDetails: (id: number) => void;
}

const LogEntryComponent = memo<LogEntryProps>(
  ({ log, isExpanded, onToggleDetails }) => {
    const getLogIcon = useMemo(() => {
      const iconClass = "w-4 h-4";

      if (log.source === "presence")
        return <Users className={cn(iconClass, "text-blue-500")} />;
      if (log.source === "database")
        return <Database className={cn(iconClass, "text-purple-500")} />;
      if (log.source === "broadcast")
        return <Radio className={cn(iconClass, "text-green-500")} />;
      if (log.source === "self")
        return <Send className={cn(iconClass, "text-blue-600")} />;

      switch (log.type) {
        case "success":
          return <CheckCircle className={cn(iconClass, "text-green-500")} />;
        case "error":
          return <XCircle className={cn(iconClass, "text-red-500")} />;
        case "warning":
          return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
        default:
          return <Info className={cn(iconClass, "text-blue-500")} />;
      }
    }, [log.source, log.type]);

    const getSourceBadge = useMemo(() => {
      const badgeClasses = "text-xs";

      switch (log.source) {
        case "self":
          return (
            <Badge
              variant="default"
              className={cn(badgeClasses, "bg-blue-100 text-blue-800")}
            >
              Self
            </Badge>
          );
        case "broadcast":
          return (
            <Badge
              variant="secondary"
              className={cn(badgeClasses, "bg-green-100 text-green-800")}
            >
              Broadcast
            </Badge>
          );
        case "database":
          return (
            <Badge
              variant="secondary"
              className={cn(badgeClasses, "bg-purple-100 text-purple-800")}
            >
              Database
            </Badge>
          );
        case "presence":
          return (
            <Badge
              variant="secondary"
              className={cn(badgeClasses, "bg-blue-100 text-blue-800")}
            >
              Presence
            </Badge>
          );
        case "system":
          return (
            <Badge variant="outline" className={badgeClasses}>
              System
            </Badge>
          );
        default:
          return null;
      }
    }, [log.source]);

    const handleToggleDetails = useCallback(() => {
      onToggleDetails(log.id);
    }, [log.id, onToggleDetails]);

    return (
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 pt-0.5">
              {getLogIcon}
              <div className="w-px h-4 bg-border last:hidden"></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize">
                    {log.type}
                  </Badge>
                  {getSourceBadge}
                  {log.event && (
                    <Badge variant="secondary" className="text-xs">
                      {log.event}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </div>
                </div>
                {log.details && (
                  <Button
                    onClick={handleToggleDetails}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>

              <p className="text-sm text-foreground font-mono leading-relaxed break-words">
                {log.message}
              </p>

              {log.details && isExpanded && (
                <div className="mt-3 p-3 bg-muted rounded-md ">
                  <div className="flex items-center gap-1 mb-2">
                    <Database className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      DETAILS
                    </span>
                  </div>
                  <ScrollArea className="max-h-60 h-[calc(100vh-200px)]">
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
    );
  }
);

LogEntryComponent.displayName = "LogEntry";

// ============================================================================
// MAIN COMPONENT - OPTIMIZED
// ============================================================================

const SupabaseDevTools: React.FC<SupabaseDevToolsProps> = ({
  client,
  position = "bottom-right",
  defaultChannel = "devtools-monitor",
  enableKeyboardShortcut = true,
  keyboardShortcut = "Ctrl+Shift+D",
  autoShow = false,
  maxLogs = 200,
}) => {
  // ============================================================================
  // STATE MANAGEMENT - OPTIMIZED WITH REDUCER
  // ============================================================================

  const [isOpen, setIsOpen] = useState(autoShow);
  const [state, dispatch] = useReducer(devToolsReducer, createInitialState());
  const [config, setConfig] = useState<DevToolsConfig>(() => {
    const loadedConfig = loadConfig(defaultChannel);
    return { ...loadedConfig, maxLogs };
  });

  // ============================================================================
  // REFS & MEMOIZED VALUES
  // ============================================================================

  const abortControllerRef = useRef<AbortController>(new AbortController());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(
    () => getSupabaseClient(client as SupabaseClient),
    [client]
  );

  const statusInfo = useMemo(() => {
    if (state.authError) {
      return CONFIG.status.authError;
    }
    if (state.isAuthenticated && state.isMonitoring) {
      return CONFIG.status.monitoring;
    }
    if (state.isAuthenticated) {
      return CONFIG.status.connected;
    }
    return { text: "Offline", color: "text-gray-500", bgColor: "bg-gray-500" };
  }, [state.authError, state.isAuthenticated, state.isMonitoring]);

  const filteredLogs = useMemo(() => {
    return config.showSystemLogs
      ? state.logs
      : state.logs.filter((log) => log.source !== "system");
  }, [state.logs, config.showSystemLogs]);

  // ============================================================================
  // OPTIMIZED CALLBACKS - MINIMAL DEPENDENCIES
  // ============================================================================

  const addLog = useCallback(
    (
      type: LogEntry["type"],
      message: string,
      source: LogEntry["source"],
      details?: Record<string, unknown>,
      event?: string
    ) => {
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      dispatch({
        type: "ADD_LOG",
        payload: { type, message, source, details, event },
      });
    },
    []
  );

  const updateConfig = useCallback((updates: Partial<DevToolsConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const debouncedScroll = useMemo(
    () =>
      debounce(() => {
        if (config.autoScroll && logContainerRef.current) {
          logContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100),
    [config.autoScroll]
  );

  // ============================================================================
  // AUTH CHECK
  // ============================================================================

  const checkAuth = useCallback(async () => {
    if (!supabase || abortControllerRef.current.signal.aborted) return;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (abortControllerRef.current.signal.aborted) return;

      if (error) throw error;

      const authenticated = !!session;
      dispatch({
        type: "SET_AUTH_STATE",
        payload: {
          isAuthenticated: authenticated,
          authError: authenticated ? null : "No active session",
        },
      });

      if (!authenticated) {
        addLog("warning", "🔒 No active Supabase session", "system", {
          session: null,
        });
      }
    } catch (error: unknown) {
      if (abortControllerRef.current.signal.aborted) return;

      const errorMessage =
        error instanceof Error ? error.message : "Authentication check failed";
      dispatch({
        type: "SET_AUTH_STATE",
        payload: {
          isAuthenticated: false,
          authError: errorMessage,
        },
      });
      addLog("error", `🔴 Auth failed: ${errorMessage}`, "system", { error });
    }
  }, [supabase, addLog]);

  // ============================================================================
  // MONITORING FUNCTIONS
  // ============================================================================

  const startMonitoring = useCallback(() => {
    if (!supabase || !state.isAuthenticated || !config.channelName.trim()) {
      addLog(
        "error",
        "Cannot start: missing client, auth, or channel name",
        "system"
      );
      return;
    }

    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.warn("SupabaseDevTools: Error unsubscribing", error);
      }
      channelRef.current = null;
    }

    const channel = supabase.channel(config.channelName);
    channelRef.current = channel;

    if (config.enableBroadcast) {
      channel.on("broadcast", { event: `*` }, (payload: any) => {
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        console.log((channelRef.current as any)?.subTopic);
        console.log(config.channelName);

        if ((channelRef.current as any)?.subTopic !== config.channelName) {
          return;
        }
        addLog(
          "success",
          `📻 Broadcast: ${payload.event || "unknown"}`,
          "broadcast",
          payload,
          payload.event
        );
      });
    }

    if (config.enableDatabase) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "*", table: "*" },
        (payload: any) => {
          if (abortControllerRef.current.signal.aborted) {
            return;
          }

          console.log(payload?.originChannel);

          addLog(
            "success",
            `🗄️ DB ${payload.eventType}: ${payload.table}`,
            "database",
            {
              eventType: payload.eventType,
              table: payload.table,
              schema: payload.schema,
              new: payload.new,
              old: payload.old,
            },
            payload.eventType
          );
        }
      );
    }

    // Presence listener
    if (config.enablePresence) {
      channel.on("presence", { event: "*" }, (payload: any) => {
        if (abortControllerRef.current.signal.aborted) return;
        addLog(
          "info",
          `👥 Presence: ${payload.event}`,
          "presence",
          payload,
          payload.event
        );
      });
    }

    channel.subscribe((status: string, err?: Error) => {
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (err) {
        addLog("error", `❌ Subscription error: ${err.message}`, "system", {
          error: err,
        });
        dispatch({ type: "SET_MONITORING", payload: false });
        dispatch({ type: "UPDATE_STATS", payload: { isConnected: false } });
      } else {
        addLog("info", `📡 Status: ${status}`, "system", { status });

        if (status === "SUBSCRIBED") {
          dispatch({
            type: "SET_MONITORING",
            payload: true,
          });

          dispatch({
            type: "UPDATE_STATS",
            payload: { isConnected: true },
          });

          addLog("success", `✅ Monitoring ${config.channelName}`, "system");

          startTimeRef.current = new Date();
          addLog("success", `✅ Monitoring ${config.channelName}`, "system");
        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          dispatch({ type: "SET_MONITORING", payload: false });
          dispatch({ type: "UPDATE_STATS", payload: { isConnected: false } });
        }
      }
    });
  }, [supabase, state.isAuthenticated, config, addLog]);

  const stopMonitoring = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        addLog("info", `⏹️ Stopped monitoring ${config.channelName}`, "system");
      } catch (error) {
        addLog("warning", `⚠️ Error stopping: ${error}`, "system");
      }
      channelRef.current = null;
    }

    dispatch({ type: "SET_MONITORING", payload: false });
    dispatch({ type: "UPDATE_STATS", payload: { isConnected: false } });
    startTimeRef.current = null;
  }, [config.channelName, addLog]);

  const sendTestBroadcast = useCallback(() => {
    if (!supabase || !state.isAuthenticated || !state.isMonitoring) {
      addLog(
        "warning",
        "Cannot send: not authenticated or monitoring",
        "system"
      );
      return;
    }

    const testPayload = {
      message: "DevTools test broadcast",
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substr(2, 9),
      source: "devtools",
    };

    try {
      const channel = supabase.channel(config.channelName);
      channel
        .send({
          type: "broadcast",
          event: "devtools-test",
          payload: testPayload,
        })
        .then(() => {
          addLog(
            "success",
            "📡 Test broadcast sent",
            "self",
            testPayload,
            "devtools-test"
          );
        })
        .catch((error: Error) => {
          addLog("error", `❌ Broadcast failed: ${error.message}`, "system", {
            error,
          });
        });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog("error", `❌ Broadcast setup failed: ${errorMessage}`, "system", {
        error,
      });
    }
  }, [
    supabase,
    state.isAuthenticated,
    state.isMonitoring,
    config.channelName,
    addLog,
  ]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const toggleLogDetails = useCallback((logId: number) => {
    dispatch({ type: "TOGGLE_LOG_DETAILS", payload: logId });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: "CLEAR_LOGS" });
  }, []);

  const handleToggleOpen = useCallback(() => {
    if (!state.authError) {
      setIsOpen((prev) => !prev);
    }
  }, [state.authError]);

  // ============================================================================
  // Side Effects
  // ============================================================================

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (supabase) {
      checkAuth();
    } else {
      dispatch({
        type: "SET_AUTH_STATE",
        payload: {
          isAuthenticated: false,
          authError: "Supabase client not found",
        },
      });
      addLog("error", "🔴 Supabase client not available", "system");
    }

    return () => {
      abortController.abort();
      stopMonitoring();
    };
  }, [supabase, checkAuth, addLog, stopMonitoring]);

  // Auto-scroll effect
  useEffect(() => {
    debouncedScroll();
  }, [state.logs.length, debouncedScroll]);

  // Stop monitoring if auth is lost
  useEffect(() => {
    if (!state.isAuthenticated && state.isMonitoring) {
      stopMonitoring();
    }
  }, [state.isAuthenticated, state.isMonitoring, stopMonitoring]);

  // Keyboard shortcut
  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const parts = keyboardShortcut.toLowerCase().split("+");
      const hasCtrl = parts.includes("ctrl") && e.ctrlKey;
      const hasShift = parts.includes("shift") && e.shiftKey;
      const key = parts[parts.length - 1];

      if (hasCtrl && hasShift && e.key.toLowerCase() === key) {
        e.preventDefault();
        handleToggleOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardShortcut, keyboardShortcut, handleToggleOpen]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) {
    return (
      <div
        onClick={handleToggleOpen}
        className={cn(
          "fixed z-50 group cursor-pointer",
          position === "bottom-left"
            ? "bottom-4 left-4"
            : position === "top-right"
            ? "top-4 right-4"
            : position === "top-left"
            ? "top-4 left-4"
            : "bottom-4 right-4",
          state.authError && "cursor-not-allowed"
        )}
        title={`Supabase DevTools (${keyboardShortcut})`}
      >
        <div
          className={cn(
            "bg-background border border-border p-3 rounded-lg shadow-lg transition-all duration-300",
            state.authError
              ? "border-red-500 bg-red-50"
              : "hover:shadow-xl transform hover:scale-105"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className={cn("w-3 h-3 rounded-full", statusInfo.bgColor)}
              ></div>
              {state.isMonitoring && !state.authError && (
                <div
                  className={cn(
                    "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75",
                    statusInfo.bgColor
                  )}
                ></div>
              )}
            </div>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                statusInfo.color
              )}
            >
              {CONFIG.info.title}
            </span>
            {state.stats.totalMessages > 0 && (
              <Badge variant="secondary" className="text-xs">
                {state.stats.totalMessages}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-[550px] h-screen">
      <Card className="h-full w-full border-l-0 border-b-0 border-r-0 rounded-none rounded-tl-xl bg-background/95 backdrop-blur-sm border-border shadow-2xl pb-0 gap-0">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="relative">
                <div
                  className={cn("w-3 h-3 rounded-full", statusInfo.bgColor)}
                ></div>
                {state.isMonitoring && !state.authError && (
                  <div
                    className={cn(
                      "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75",
                      statusInfo.bgColor
                    )}
                  ></div>
                )}
              </div>
              <span className="font-mono font-semibold">
                {CONFIG.info.title}
              </span>
              <Badge variant="outline" className="text-xs">
                {CONFIG.info.version}
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
          {/* Auth Error Banner */}
          {state.authError && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">
                  Connection Issue
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1">{state.authError}</p>
            </div>
          )}

          <Tabs defaultValue="monitor" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="monitor" className="flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monitor" className="flex-1 flex flex-col mt-0">
              {/* Monitor Controls */}
              <div
                className={cn(
                  "p-4 border-b bg-muted/30",
                  state.authError && "opacity-50"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Channel Monitor</h3>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusInfo.color)}
                    >
                      {statusInfo.text}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={config.channelName}
                      onChange={(e) =>
                        updateConfig({ channelName: e.target.value })
                      }
                      placeholder="Channel name..."
                      disabled={state.isMonitoring || !!state.authError}
                      className="flex-1 h-9 text-sm"
                    />
                    {!state.isMonitoring ? (
                      <Button
                        onClick={startMonitoring}
                        disabled={!!state.authError}
                        size="sm"
                        className="h-9 px-3"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
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

                  {state.isMonitoring && config.enableSelfTestBroadcast && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-700 font-medium">
                          Monitoring: {config.channelName}
                        </span>
                      </div>

                      <Button
                        onClick={sendTestBroadcast}
                        className="w-full h-8"
                        disabled={!!state.authError}
                      >
                        <Send className="w-3 h-3 mr-2" />
                        Send Test Broadcast
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Logs Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      Logs
                      <Badge variant="outline" className="ml-2 text-xs">
                        {filteredLogs.length}
                      </Badge>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={clearLogs}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Logs Display */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea
                  className="h-[calc(100vh-350px)]"
                  ref={logContainerRef}
                >
                  {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        No logs yet
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {state.authError
                          ? "Fix connection to see logs"
                          : state.isMonitoring
                          ? "Waiting for activity..."
                          : "Start monitoring to see logs"}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {filteredLogs.map((log) => (
                        <LogEntryComponent
                          key={log.id}
                          log={log}
                          isExpanded={state.expandedLogs.has(log.id)}
                          onToggleDetails={toggleLogDetails}
                        />
                      ))}
                    </div>
                  )}
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    Connection Statistics
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Connection</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <Badge
                              variant={
                                state.stats.isConnected
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {state.stats.isConnected
                                ? "Monitoring"
                                : "Not Monitoring"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Channel:
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline">
                                  {config.channelName.substring(0, 15)}
                                  {config.channelName.length > 15 && "..."}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Channel: {config.channelName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Messages</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total:
                            </span>
                            <Badge variant="outline">
                              {state.stats.totalMessages}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Broadcast:
                            </span>
                            <Badge variant="secondary">
                              {state.stats.messageTypes.broadcast}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Database:
                            </span>
                            <Badge variant="secondary">
                              {state.stats.messageTypes.database}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Activity</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Presence:
                            </span>
                            <Badge variant="secondary">
                              {state.stats.messageTypes.presence}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              System:
                            </span>
                            <Badge variant="secondary">
                              {state.stats.messageTypes.system}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Last Activity:
                            </span>
                            <span className="font-mono text-xs">
                              {state.stats.lastActivity
                                ? state.stats.lastActivity.toLocaleTimeString()
                                : "None"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Logs</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total:
                            </span>
                            <Badge variant="outline">{state.logs.length}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Filtered:
                            </span>
                            <Badge variant="outline">
                              {filteredLogs.length}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max:</span>
                            <Badge variant="outline">{config.maxLogs}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Message Type Distribution */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-3">
                      Message Distribution
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(state.stats.messageTypes).map(
                        ([type, count]) => (
                          <div key={type} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16 capitalize">
                              {type}:
                            </span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2 transition-all duration-300"
                                style={{
                                  width:
                                    state.stats.totalMessages > 0
                                      ? `${
                                          (count / state.stats.totalMessages) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono w-8">
                              {count}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-4 pt-4">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Configuration</h3>
                </div>

                <div className="space-y-4">
                  <ScrollArea className="h-[calc(100vh-200px)] p-4 flex flex-col gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">
                            Event Listeners
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-sm">
                                  Broadcast Events
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  Listen for broadcast messages
                                </p>
                              </div>
                              <Switch
                                checked={config.enableBroadcast}
                                onCheckedChange={(checked) =>
                                  updateConfig({ enableBroadcast: checked })
                                }
                                disabled={state.isMonitoring}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-sm">
                                  Database Changes
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  Listen for postgres changes
                                </p>
                              </div>
                              <Switch
                                checked={config.enableDatabase}
                                onCheckedChange={(checked) =>
                                  updateConfig({ enableDatabase: checked })
                                }
                                disabled={state.isMonitoring}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-sm">Presence Events</span>
                                <p className="text-xs text-muted-foreground">
                                  Listen for presence updates
                                </p>
                              </div>
                              <Switch
                                checked={config.enablePresence}
                                onCheckedChange={(checked) =>
                                  updateConfig({ enablePresence: checked })
                                }
                                disabled={state.isMonitoring}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-sm">
                                  Allow Self Test Broadcast
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  Allow self test broadcast of events
                                </p>
                              </div>
                              <Switch
                                checked={config.enableSelfTestBroadcast}
                                onCheckedChange={(checked) =>
                                  updateConfig({
                                    enableSelfTestBroadcast: checked,
                                  })
                                }
                                disabled={state.isMonitoring}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="my-4">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">
                            Display Options
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-sm">
                                  Show System Logs
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  Include connection and system messages
                                </p>
                              </div>
                              <Switch
                                checked={config.showSystemLogs}
                                onCheckedChange={(checked) =>
                                  updateConfig({ showSystemLogs: checked })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-sm">Auto Scroll</span>
                                <p className="text-xs text-muted-foreground">
                                  Automatically scroll to new messages
                                </p>
                              </div>
                              <Switch
                                checked={config.autoScroll}
                                onCheckedChange={(checked) =>
                                  updateConfig({ autoScroll: checked })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Max Logs</span>
                                <Badge variant="outline">
                                  {config.maxLogs}
                                </Badge>
                              </div>
                              <Input
                                type="number"
                                value={config.maxLogs}
                                onChange={(e) =>
                                  updateConfig({
                                    maxLogs: Math.max(
                                      10,
                                      Math.min(
                                        1000,
                                        parseInt(e.target.value) || 100
                                      )
                                    ),
                                  })
                                }
                                min="10"
                                max="1000"
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">DevTools Info</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Version:
                              </span>
                              <Badge variant="outline">
                                {CONFIG.info.version}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Shortcut:
                              </span>
                              <Badge variant="secondary">
                                {keyboardShortcut}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Supabase:
                              </span>
                              <Badge
                                variant={supabase ? "default" : "destructive"}
                                className={cn(
                                  "cursor-pointer",
                                  supabase ? "bg-green-500" : "bg-red-500"
                                )}
                                onClick={() => {
                                  console.log(supabase);
                                }}
                              >
                                {supabase ? "Connected" : "Not Found"}
                              </Badge>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <Button
                              onClick={() => {
                                clearLogs();
                                updateConfig(DEFAULT_CONFIG);
                                addLog(
                                  "info",
                                  "🔄 Settings reset to defaults",
                                  "system"
                                );
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Reset to Defaults
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Status */}
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Channel: {config.channelName}</span>
                {state.stats.lastActivity && (
                  <span>
                    Last: {state.stats.lastActivity.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>{statusInfo.text}</span>
                <div
                  className={cn("w-2 h-2 rounded-full", statusInfo.bgColor)}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseDevTools;

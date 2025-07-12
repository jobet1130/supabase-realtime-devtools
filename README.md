# Supabase Realtime Dev Tools

A comprehensive realtime debugging and monitoring tool for Supabase applications. Monitor channels, broadcast messages, track database changes, analyze connection statistics, and debug realtime subscriptions with an intuitive three-tab developer interface.

![Supabase Realtime Dev Tools](https://img.shields.io/badge/version-1.0-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

### 🖥️ **Three-Tab Interface**

- **Monitor Tab**: Real-time channel monitoring with live logs
- **Stats Tab**: Comprehensive connection statistics and message analytics
- **Settings Tab**: Full configuration control with persistent settings

### 📡 **Advanced Channel Monitoring**

- **Multi-Event Support**: Monitor broadcast, database changes, and presence events
- **Real-time Connection Status**: Visual indicators with animated status badges
- **Channel Subscription Management**: Start/stop monitoring with instant feedback
- **Auto-Reconnection**: Handles connection drops gracefully
- **Authentication Awareness**: Monitors Supabase auth state in real-time

### 🎯 **Enhanced Logging System**

- **Categorized Logs**: Success, Error, Warning, and Info messages with color-coded icons
- **Source Tracking**: Distinguish between broadcast, database, presence, system, and self-generated events
- **Expandable Details**: Click to view full JSON payloads with syntax highlighting
- **Smart Filtering**: Toggle system logs visibility, auto-scroll controls
- **Persistent History**: Configurable log retention (10-1000 entries)
- **Live Timestamps**: Millisecond-precision timestamps for debugging

### 📊 **Comprehensive Statistics**

- **Connection Metrics**: Real-time connection status, uptime tracking, last activity
- **Message Analytics**: Total messages, per-type counters, message distribution graphs
- **Performance Tracking**: Activity monitoring with visual progress indicators
- **Channel Information**: Current channel details with tooltip support
- **Log Statistics**: Total vs filtered log counts, retention settings

### 🛠️ **Advanced Configuration**

- **Event Listeners**: Granular control over broadcast, database, and presence events
- **Self-Test Broadcasting**: Send test messages to verify channel functionality
- **Display Options**: System log visibility, auto-scroll behavior, log limits
- **Persistent Settings**: Local storage for all configuration with reset functionality
- **Keyboard Shortcuts**: Customizable hotkeys with user-defined combinations

### 🎨 **Professional UI/UX**

- **Responsive Design**: Optimized for development workflows with full-screen interface
- **Visual Indicators**: Color-coded status badges, animated connection states
- **Smooth Interactions**: Polished animations, hover effects, and transitions
- **Accessibility**: Keyboard navigation, screen reader support, tooltip guidance
- **Performance Optimized**: Memoized components, reducer-based state management

### 🔐 **Authentication Integration**

- **Real-time Auth Status**: Monitors Supabase session state continuously
- **Visual Auth Indicators**: Clear status badges for connection state
- **Error Handling**: Graceful degradation with informative error messages
- **Session Management**: Automatic session detection and validation

### ⚡ **Performance & Reliability**

- **Optimized Rendering**: Memoized components prevent unnecessary re-renders
- **State Management**: Reducer-based architecture for predictable state updates
- **Memory Management**: Automatic log cleanup and efficient data structures
- **Error Boundaries**: Graceful error handling with detailed error reporting

## 📦 Installation

### Before You Start

Make sure you have:

- ✅ **Node.js** installed ([download here](https://nodejs.org))
- ✅ **Your own project** with shadcn/ui already set up
- ✅ **Two terminal windows** available

### Option 1: Install from Local Registry (Recommended)

**Step 1: Get This Project Running on Your Computer**

1. **Download this project** to your computer:

```bash
git clone https://github.com/yourusername/supabase-realtime-dev-tools.git
cd supabase-realtime-dev-tools
```

2. **Install the project's dependencies**:

```bash
npm install
```

3. **Start the project** (this creates a local server):

```bash
npm run dev
```

4. **Wait for it to start** - you'll see a message like:

```
▲ Next.js 15.1.4
- Local:        http://localhost:3000
```

**Step 2: Install the Component in Your Project**

5. **Open a new terminal window** (keep the first one running!)

6. **Go to your own project folder** where you want to use the component:

```bash
cd /path/to/your-project
# Example: cd ~/Desktop/my-nextjs-app
# Or: cd C:\Users\YourName\my-react-project
```

7. **Install the component** from your local server:

```bash
npx shadcn@latest add http://localhost:3000/r/supabase-realtime-dev-tools.json
```

8. **That's it!** The component is now installed in your project.

> **Important**: Keep the first terminal running (from Step 4) until you finish installing the component. After installation, you can stop it with `Ctrl+C`.

**Visual Guide:**

```
Terminal 1 (Keep Running)          Terminal 2 (Your Commands)
┌─────────────────────────┐       ┌─────────────────────────┐
│ supabase-dev-tools/     │       │ your-project/           │
│ $ npm run dev           │       │ $ cd /path/to/your-proj │
│ ▲ Next.js running...    │  ───► │ $ npx shadcn add http://│
│ Local: localhost:3000   │       │   localhost:3000/r/...  │
└─────────────────────────┘       └─────────────────────────┘
```

**Common Issues:**

- ❌ **"Cannot connect to localhost:3000"** → Make sure Terminal 1 is still running with `npm run dev`
- ❌ **"Command not found: npx"** → Install Node.js from [nodejs.org](https://nodejs.org)
- ❌ **"shadcn not found"** → Make sure you're in a project that already has shadcn/ui set up

### Option 2: Manual Installation

1. **Install Dependencies**:

```bash
npm install @supabase/supabase-js lucide-react @radix-ui/react-scroll-area @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip class-variance-authority
```

2. **Copy the Component**:

```bash
# Create the component directory
mkdir -p src/components/ui

# Copy the component file
curl -o src/components/ui/supabase-realtime-dev-tools.tsx \
  https://raw.githubusercontent.com/yourusername/supabase-realtime-dev-tools/main/registry/new-york/supabase-realtime-dev-tools/supabase-realtime-dev-tools.tsx
```

3. **Install Required UI Components**:

```bash
npx shadcn@latest add button input badge card scroll-area switch tabs tooltip textarea label
```

## 🚀 Usage

### Basic Usage

```tsx
import SupabaseDevTools from "@/components/ui/supabase-realtime-dev-tools";

export default function App() {
  return (
    <div>
      {/* Your app content */}
      <SupabaseDevTools />
    </div>
  );
}
```

### Advanced Configuration

```tsx
import SupabaseDevTools from "@/components/ui/supabase-realtime-dev-tools";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function App() {
  return (
    <div>
      {/* Your app content */}
      <SupabaseDevTools
        client={supabase}
        position="top-left"
        defaultChannel="my-project-channel"
        maxLogs={200}
        keyboardShortcut="Ctrl+Alt+D"
        enableKeyboardShortcut={true}
        autoShow={false}
      />
    </div>
  );
}
```

### Global Client Detection

The component automatically detects Supabase clients:

```tsx
// Option 1: Pass client explicitly
<SupabaseDevTools client={supabase} />

// Option 2: Global detection (window.supabase or window.__supabase)
<SupabaseDevTools />
```

## ⚙️ Props

| Prop                     | Type                                                           | Default              | Description                           |
| ------------------------ | -------------------------------------------------------------- | -------------------- | ------------------------------------- |
| `client`                 | `SupabaseClient`                                               | `undefined`          | Your Supabase client instance         |
| `position`               | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"`     | DevTools panel position               |
| `defaultChannel`         | `string`                                                       | `"devtools-monitor"` | Initial channel name                  |
| `maxLogs`                | `number`                                                       | `200`                | Maximum number of log entries         |
| `enableKeyboardShortcut` | `boolean`                                                      | `true`               | Enable keyboard shortcut              |
| `keyboardShortcut`       | `string`                                                       | `"Ctrl+Shift+D"`     | Keyboard shortcut to toggle           |
| `autoShow`               | `boolean`                                                      | `false`              | Auto-show DevTools on component mount |

## 🔧 How It Works

### Monitor Tab

The Monitor tab is your command center for real-time debugging:

#### **Channel Control**

- **Start/Stop Monitoring**: Connect to any Supabase channel with real-time status
- **Channel Input**: Type any channel name to monitor
- **Connection Status**: Visual indicators show connection state with animated badges
- **Test Broadcasting**: Send test messages to verify channel functionality

#### **Live Logging**

- **Real-time Events**: See all channel activity as it happens
- **Event Categorization**: Broadcast, Database, Presence, System, and Self events
- **Expandable Details**: Click any log entry to see full JSON payload
- **Smart Filtering**: Toggle system logs, auto-scroll controls

#### **Visual Indicators**

| Badge Color | Source    | Description                               |
| ----------- | --------- | ----------------------------------------- |
| 🟢 Green    | Broadcast | Broadcast events from other clients       |
| 🟣 Purple   | Database  | Database changes (INSERT, UPDATE, DELETE) |
| 🔵 Blue     | Presence  | Presence events (joins, leaves, updates)  |
| 🔵 Blue     | Self      | Messages you sent (test broadcasts)       |
| ⚫ Gray     | System    | DevTools internal messages                |

| Status Badge    | Description                  |
| --------------- | ---------------------------- |
| 🟢 Connected    | Connected and authenticated  |
| 🔴 Disconnected | Not connected or auth failed |
| 🟢 Monitoring   | Actively monitoring channel  |
| 🔴 Auth Error   | Authentication issue         |

### Stats Tab

Comprehensive analytics for your realtime connections:

#### **Connection Statistics**

- **Real-time Status**: Current connection state and monitoring status
- **Channel Information**: Active channel name with tooltip details
- **Activity Tracking**: Last activity timestamp and uptime metrics

#### **Message Analytics**

- **Total Messages**: Complete count of all received messages
- **Per-Type Counters**: Separate counts for broadcast, database, presence, system events
- **Message Distribution**: Visual progress bars showing message type ratios
- **Log Statistics**: Total vs filtered log counts with retention settings

#### **Performance Metrics**

- **Connection Health**: Monitor connection stability and performance
- **Activity Monitoring**: Track message frequency and patterns
- **Memory Usage**: Log count management and cleanup statistics

### Settings Tab

Full configuration control with persistent settings:

#### **Event Listeners**

- **Broadcast Events**: Toggle broadcast message monitoring
- **Database Changes**: Enable/disable postgres_changes listener
- **Presence Events**: Control presence event monitoring
- **Self-Test Broadcasting**: Allow sending test messages

#### **Display Options**

- **System Logs**: Show/hide DevTools internal messages
- **Auto-Scroll**: Automatically scroll to new log entries
- **Max Logs**: Set log retention limit (10-1000 entries)

#### **DevTools Information**

- **Version Display**: Current DevTools version
- **Keyboard Shortcut**: Shows configured hotkey
- **Supabase Status**: Client connection status with debug info
- **Reset Settings**: Restore all settings to defaults

### Authentication Flow

The DevTools automatically handles authentication:

1. **Session Detection**: Automatically detects active Supabase sessions
2. **Real-time Monitoring**: Continuously monitors auth state changes
3. **Visual Feedback**: Clear status indicators for auth state
4. **Error Handling**: Graceful degradation with informative error messages
5. **Reconnection**: Automatic reconnection when auth is restored

### Performance Optimizations

- **Memoized Components**: Prevent unnecessary re-renders
- **Reducer Architecture**: Predictable state management
- **Debounced Updates**: Smooth scrolling and UI updates
- **Memory Management**: Automatic log cleanup and efficient data structures

## 🎯 Event Types

### Broadcast Events

Monitor custom broadcast messages:

```tsx
// In your app - sending broadcasts
const channel = supabase.channel("my-channel");
channel.send({
  type: "broadcast",
  event: "custom-event",
  payload: { message: "Hello World" },
});

// DevTools will show:
// 📻 Broadcast: custom-event
// Click to expand full payload
```

### Database Changes

Monitor postgres_changes events:

```tsx
// In your app - database subscription
const channel = supabase.channel("db-changes").on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "posts",
  },
  (payload) => {
    console.log("Change received!", payload);
  }
);

// DevTools will show:
// 🗄️ DB INSERT: posts
// 🗄️ DB UPDATE: posts
// 🗄️ DB DELETE: posts
```

### Presence Events

Monitor user presence:

```tsx
// In your app - presence tracking
const channel = supabase
  .channel("online-users")
  .on("presence", { event: "sync" }, () => {
    console.log("Presence synced");
  })
  .on("presence", { event: "join" }, ({ key, newPresences }) => {
    console.log("User joined", newPresences);
  });

// DevTools will show:
// 👥 Presence: sync
// 👥 Presence: join
// 👥 Presence: leave
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase project with realtime enabled

### Setup

1. **Clone the Repository**:

```bash
git clone https://github.com/yourusername/supabase-realtime-dev-tools.git
cd supabase-realtime-dev-tools
```

2. **Install Dependencies**:

```bash
npm install
# or
pnpm install
```

3. **Run the Development Server**:

```bash
npm run dev
# or
pnpm dev
```

4. **Open in Browser**:

```bash
open http://localhost:3000
```

### Project Structure

```
supabase-realtime-dev-tools/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Demo page
│   └── layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui components
│   └── providers.tsx            # Context providers
├── registry/                     # Component registry
│   └── new-york/
│       └── supabase-realtime-dev-tools/
│           └── supabase-realtime-dev-tools.tsx
├── public/                       # Static assets
│   └── r/                       # Registry definitions
│       └── supabase-realtime-dev-tools.json
├── lib/                         # Utility functions
└── package.json
```

### Development Features

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Utility-first styling
- **Component Registry**: Easy distribution system

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the Repository**
2. **Create a Feature Branch**:

```bash
git checkout -b feature/amazing-feature
```

3. **Make Your Changes**:

   - Follow the existing code style
   - Add TypeScript types for new features
   - Update tests if applicable
   - Test across different browsers

4. **Test Your Changes**:

```bash
npm run dev
# Test the component thoroughly
# Try different Supabase configurations
# Test keyboard shortcuts and UI interactions
```

5. **Submit a Pull Request**:
   - Describe your changes clearly
   - Include screenshots/videos for UI changes
   - Reference any related issues
   - Add tests for new functionality

### Code Style Guidelines

- **TypeScript**: Use strict typing with readonly interfaces
- **React**: Functional components with hooks, memoization for performance
- **Styling**: Tailwind CSS classes, consistent spacing and colors
- **Components**: shadcn/ui patterns, accessible design
- **State Management**: Reducer pattern for complex state
- **Performance**: Memoized components, debounced actions

### Areas for Contribution

- 🐛 **Bug Fixes**: Report and fix issues, improve error handling
- ✨ **New Features**: Export logs, custom themes, advanced filtering
- 📊 **Analytics**: Enhanced statistics, performance metrics
- 📚 **Documentation**: Improve guides, add examples, video tutorials
- 🎨 **UI/UX**: Design improvements, accessibility enhancements
- 🔧 **Developer Experience**: Better TypeScript support, testing utilities
- 🌐 **Internationalization**: Multi-language support
- 🔌 **Integrations**: Support for other realtime services

## 🎨 Customization

### Styling

The component uses Tailwind CSS and shadcn/ui. Customize by:

1. **Modifying CSS Variables**:

```css
:root {
  --primary: your-primary-color;
  --secondary: your-secondary-color;
  --muted: your-muted-color;
  --border: your-border-color;
  /* ... other CSS variables */
}
```

2. **Custom Positioning**:

```tsx
import SupabaseDevTools from "@/components/ui/supabase-realtime-dev-tools";
import { cn } from "@/lib/utils";

export function CustomDevTools(props) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 w-full h-full z-[9999]",
        props.className
      )}
    >
      <SupabaseDevTools {...props} />
    </div>
  );
}
```

3. **Theme Integration**:

```tsx
// Integrate with your theme system
import { useTheme } from "next-themes";

export function ThemedDevTools() {
  const { theme } = useTheme();

  return (
    <div className={cn("supabase-devtools", theme === "dark" && "dark")}>
      <SupabaseDevTools />
    </div>
  );
}
```

### Functionality

1. **Custom Log Processing**:

```tsx
// Fork the component and modify log handling
const customAddLog = useCallback((type, message, source, details) => {
  // Add custom processing
  const processedMessage = customProcessor(message);
  const enrichedDetails = { ...details, customData: getCustomData() };

  // Original log logic
  dispatch({
    type: "ADD_LOG",
    payload: {
      type,
      message: processedMessage,
      source,
      details: enrichedDetails,
    },
  });
}, []);
```

2. **Advanced Event Handling**:

```tsx
// Add custom event listeners
const channel = supabase
  .channel(channelName)
  .on("broadcast", { event: "custom-event" }, (payload) => {
    // Custom handling for specific events
    addLog("info", `Custom event: ${payload.type}`, "broadcast", payload);
  })
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "specific_table",
    },
    (payload) => {
      // Table-specific handling
      addLog("success", `Table update: ${payload.table}`, "database", payload);
    }
  );
```

3. **Custom Configuration**:

```tsx
// Extend the configuration interface
interface CustomConfig extends DevToolsConfig {
  customSetting: boolean;
  advancedOptions: Record<string, any>;
}

// Use with custom settings
const [customConfig, setCustomConfig] = useState<CustomConfig>({
  ...DEFAULT_CONFIG,
  customSetting: true,
  advancedOptions: { feature: true },
});
```

## 📋 Requirements

### Runtime Requirements

- **React**: 18.0.0 or higher
- **TypeScript**: 5.0.0 or higher
- **Supabase JS**: 2.0.0 or higher
- **Node.js**: 18.0.0 or higher

### Peer Dependencies

- **@supabase/supabase-js**: ^2.0.0
- **react**: ^18.0.0
- **react-dom**: ^18.0.0
- **lucide-react**: ^0.263.0
- **class-variance-authority**: ^0.7.0

### Development Dependencies

- **Next.js**: 13.0.0 or higher (for demo)
- **Tailwind CSS**: 3.0.0 or higher
- **shadcn/ui**: Latest version
- **TypeScript**: 5.0.0 or higher

### Browser Support

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

## 🔒 Security

### Data Handling

- **Local Storage**: Settings are stored locally, no sensitive data transmission
- **Authentication**: Uses existing Supabase session, no credential storage
- **Network**: Only connects to configured Supabase instances
- **Privacy**: No external analytics or tracking

### Best Practices

- **Environment Variables**: Store Supabase credentials securely
- **Channel Names**: Use descriptive, non-sensitive channel names
- **Development Only**: Remove from production builds
- **Access Control**: Ensure proper RLS policies on monitored tables

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) for consistent, accessible components
- Icons by [Lucide React](https://lucide.dev/) for clear, professional iconography
- Powered by [Supabase](https://supabase.com/) for realtime capabilities
- Inspired by browser DevTools and modern debugging practices

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/supabase-realtime-dev-tools/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/supabase-realtime-dev-tools/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/yourusername/supabase-realtime-dev-tools/wiki)
- 💬 **Community**: [Discord](https://discord.gg/supabase) - #realtime-devtools channel

### Frequently Asked Questions

**Q: Can I use this in production?**
A: The DevTools are designed for development. Consider removing or conditionally rendering based on environment.

**Q: Does it work with Supabase Edge Functions?**
A: Yes! Monitor Edge Function broadcasts and database changes triggered by functions.

**Q: How do I monitor multiple channels?**
A: Currently supports one channel at a time. You can quickly switch channels in the Monitor tab.

**Q: Can I export the logs?**
A: Log export is planned for a future release. Currently, you can copy log details manually.

**Q: Does it support custom event types?**
A: Yes! Any broadcast event type will be displayed with proper categorization.

---

<div align="center">
  <strong>Built with ❤️ for the Supabase community</strong>
  <br>
  <em>Happy debugging! 🐛✨</em>
</div>

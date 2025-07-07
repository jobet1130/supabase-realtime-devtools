# Supabase Realtime Dev Tools

A comprehensive realtime debugging and monitoring tool for Supabase applications. Monitor channels, broadcast messages, track database changes, and debug realtime subscriptions with an intuitive developer interface.

![Supabase Realtime Dev Tools](https://img.shields.io/badge/version-2.1-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

### 🔄 **Dual Mode Operation**

- **Listener Mode**: Monitor channels for incoming broadcasts and database changes
- **Self-Hosted Mode**: Send test broadcasts and monitor your own messages
- **Real-time Switching**: Toggle between modes without reconnecting

### 📡 **Channel Monitoring**

- Subscribe to any Supabase realtime channel
- Monitor broadcast events and postgres_changes
- Real-time connection status indicators
- Automatic reconnection handling

### 🎯 **Advanced Logging**

- **Categorized Logs**: Success, Error, Warning, and Info messages
- **Source Tracking**: Distinguish between self-broadcasts, external messages, and system events
- **Expandable Details**: Click to view full payload and metadata
- **Persistent History**: Configurable log retention (default: 100 entries)

### 🔐 **Authentication Awareness**

- Automatic Supabase authentication detection
- Real-time auth status monitoring
- Error handling for authentication failures
- Visual indicators for connection state

### ⚙️ **Highly Configurable**

- **Positioning**: 4 corner positions (bottom-right, bottom-left, top-right, top-left)
- **Keyboard Shortcuts**: Customizable hotkeys (default: Ctrl+Shift+S)
- **Persistent Settings**: Local storage for configuration
- **Theme Integration**: Built with shadcn/ui for consistent styling

### 🎨 **Beautiful UI**

- **Responsive Design**: Optimized for development workflows
- **Visual Indicators**: Color-coded status and message types
- **Smooth Animations**: Polished interactions and transitions
- **Accessibility**: Keyboard navigation and screen reader support

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
npm install @supabase/supabase-js lucide-react @radix-ui/react-scroll-area @radix-ui/react-switch class-variance-authority
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
npx shadcn@latest add button input badge card scroll-area switch
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
        supabaseClient={supabase}
        position="top-left"
        defaultChannel="my-project-channel"
        maxLogs={200}
        keyboardShortcut="Ctrl+Alt+D"
        enableKeyboardShortcut={true}
      />
    </div>
  );
}
```

## ⚙️ Props

| Prop                     | Type                                                           | Default             | Description                   |
| ------------------------ | -------------------------------------------------------------- | ------------------- | ----------------------------- |
| `supabaseClient`         | `SupabaseClient`                                               | `undefined`         | Your Supabase client instance |
| `position`               | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"`    | DevTools panel position       |
| `defaultChannel`         | `string`                                                       | `"project-updates"` | Initial channel name          |
| `maxLogs`                | `number`                                                       | `100`               | Maximum number of log entries |
| `enableKeyboardShortcut` | `boolean`                                                      | `true`              | Enable keyboard shortcut      |
| `keyboardShortcut`       | `string`                                                       | `"Ctrl+Shift+S"`    | Keyboard shortcut to toggle   |

## 🔧 How It Works

### Listener Mode (Default)

- Monitors the channel for all incoming messages
- Displays broadcasts from other clients/tabs
- Shows database changes (INSERT, UPDATE, DELETE)
- Perfect for monitoring external activity

### Self-Hosted Mode

- Sends test broadcasts to the monitored channel
- Displays only messages sent by this instance
- Ideal for testing your broadcasting setup
- Includes "Send Broadcast" button for manual testing

### Visual Indicators

| Badge           | Description                         |
| --------------- | ----------------------------------- |
| 🔵 **Self**     | Messages you sent (self-broadcasts) |
| 🟢 **External** | Messages from other clients         |
| ⚫ **System**   | DevTools internal messages          |

| Icon | Type    | Description           |
| ---- | ------- | --------------------- |
| ✅   | Success | Successful operations |
| ❌   | Error   | Failed operations     |
| ⚠️   | Warning | Important notices     |
| ℹ️   | Info    | General information   |

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
│   └── ui/                      # shadcn/ui components
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

4. **Test Your Changes**:

```bash
npm run dev
# Test the component in the browser
```

5. **Submit a Pull Request**:
   - Describe your changes
   - Include screenshots if UI changes
   - Reference any related issues

### Code Style Guidelines

- **TypeScript**: Use strict typing
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **Components**: shadcn/ui patterns
- **Naming**: Descriptive variable and function names

### Areas for Contribution

- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **New Features**: Enhance functionality
- 📚 **Documentation**: Improve guides and examples
- 🎨 **UI/UX**: Design improvements
- 🔧 **Developer Experience**: Tooling and workflow improvements

## 🎨 Customization

### Styling

The component uses Tailwind CSS and shadcn/ui. Customize by:

1. **Modifying CSS Variables**:

```css
:root {
  --primary: your-color;
  --secondary: your-color;
  /* ... other CSS variables */
}
```

2. **Extending the Component**:

```tsx
import SupabaseDevTools from "@/components/ui/supabase-realtime-dev-tools";
import { cn } from "@/lib/utils";

export function CustomDevTools(props) {
  return (
    <div className={cn("custom-positioning", props.className)}>
      <SupabaseDevTools {...props} />
    </div>
  );
}
```

### Functionality

1. **Custom Log Formatting**:

```tsx
// Fork the component and modify the addLog function
const addLog = useCallback((type, message, source, details) => {
  // Your custom logic here
  const customLog = {
    ...defaultLog,
    customField: "your-data",
  };
  setLogs((prev) => [customLog, ...prev]);
}, []);
```

2. **Additional Event Types**:

```tsx
// Add more Supabase event listeners
channel
  .on("presence", { event: "*" }, (payload) => {
    // Handle presence events
  })
  .on("your-custom-event", {}, (payload) => {
    // Handle custom events
  });
```

## 📋 Requirements

- **React**: 18.0.0 or higher
- **TypeScript**: 5.0.0 or higher
- **Supabase JS**: 2.0.0 or higher
- **Next.js**: 13.0.0 or higher (for demo)
- **Tailwind CSS**: 3.0.0 or higher

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide React](https://lucide.dev/)
- Powered by [Supabase](https://supabase.com/)

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/supabase-realtime-dev-tools/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/supabase-realtime-dev-tools/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/yourusername/supabase-realtime-dev-tools/wiki)

---

<div align="center">
  <strong>Built with ❤️ for the Supabase community</strong>
</div>

# SUPABASE-REALTIME-DEV-TOOLS

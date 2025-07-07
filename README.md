# Supabase Realtime DevTools

A comprehensive realtime debugging tool for Supabase with self-broadcasting and channel monitoring capabilities. Perfect for debugging realtime subscriptions, testing channels, and monitoring live data changes.

## Features

- 🔄 **Dual Mode Operation**: Self-broadcasting for isolated testing and listener mode for monitoring external messages
- 📡 **Channel Monitoring**: Subscribe to any Supabase realtime channel
- 🎯 **Source Distinction**: Clear visual indicators for self-broadcasts vs external messages
- 🔍 **Detailed Logging**: Expandable log entries with full payload inspection
- ⚙️ **Highly Configurable**: Customizable positioning, shortcuts, and behavior
- 🎨 **Beautiful UI**: Built with shadcn/ui components
- 🔐 **Auth Aware**: Automatic Supabase authentication detection
- 💾 **Persistent Settings**: Optional localStorage for settings persistence

## Installation

### Using shadcn/ui CLI (Recommended)

```bash
npx shadcn@latest add https://raw.githubusercontent.com/yourusername/supabase-realtime-devtools/main/registry/components/ui/supabase-devtools.json
```

### Manual Installation

1. Copy the component file to your project:

```bash
curl -o src/components/ui/supabase-devtools.tsx https://raw.githubusercontent.com/yourusername/supabase-realtime-devtools/main/src/components/ui/supabase-devtools.tsx
```

2. Install required dependencies:

```bash
npm install lucide-react @supabase/supabase-js
```

## Usage

### Basic Usage

```tsx
import { SupabaseDevTools } from "@/components/ui/supabase-devtools";

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
import { SupabaseDevTools } from "@/components/ui/supabase-devtools";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

export default function App() {
  return (
    <div>
      {/* Your app content */}
      <SupabaseDevTools
        supabaseClient={supabase}
        position="top-left"
        defaultChannel="my-channel"
        maxLogs={200}
        keyboardShortcut="Ctrl+Alt+D"
        enableLocalStorage={false}
        showTimestamps={true}
      />
    </div>
  );
}
```

## Props

| Prop                     | Type                                                           | Default             | Description                      |
| ------------------------ | -------------------------------------------------------------- | ------------------- | -------------------------------- |
| `supabaseClient`         | `SupabaseClient`                                               | `undefined`         | Your Supabase client instance    |
| `position`               | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"`    | DevTools panel position          |
| `theme`                  | `"light" \| "dark" \| "auto"`                                  | `"auto"`            | Theme preference (future use)    |
| `defaultChannel`         | `string`                                                       | `"project-updates"` | Initial channel name             |
| `maxLogs`                | `number`                                                       | `100`               | Maximum number of log entries    |
| `enableKeyboardShortcut` | `boolean`                                                      | `true`              | Enable keyboard shortcut         |
| `keyboardShortcut`       | `string`                                                       | `"Ctrl+Shift+S"`    | Keyboard shortcut to toggle      |
| `showTimestamps`         | `boolean`                                                      | `true`              | Show timestamps in logs          |
| `enableLocalStorage`     | `boolean`                                                      | `true`              | Persist settings in localStorage |

## How It Works

### Self-Broadcasting Mode (Toggle ON)

- Sends test messages to the same channel it's monitoring
- Only displays messages it sent itself (filters external messages)
- Perfect for isolated testing of your broadcasting setup
- Shows filtered message count for transparency

### Listener Mode (Toggle OFF)

- Monitors the channel for messages from other sources
- Displays all incoming broadcasts and database changes
- Ideal for monitoring activity from other tabs/clients
- No filtering applied

### Visual Indicators

- **Blue Badge**: Self-broadcasts (messages you sent)
- **Green Badge**: External messages (from other clients)
- **Gray Badge**: System messages (DevTools internal)
- **Colored Icons**: Success (green), Error (red), Warning (yellow), Info (blue)

## Requirements

- React 18+
- Supabase JS v2+
- shadcn/ui components (input, button, badge, card, scroll-area, switch)
- Lucide React icons
- Tailwind CSS

## Development

### Project Structure

```
supabase-realtime-devtools/
├── src/
│   └── components/
│       └── ui/
│           └── supabase-devtools.tsx
├── registry/
│   └── components/
│       └── ui/
│           └── supabase-devtools.json
├── package.json
├── README.md
└── LICENSE
```

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Use the component in your shadcn/ui project

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the documentation
- Review the component props and configuration options

---

Built with ❤️ for the Supabase community

# SUPABASE-REALTIME-DEV-TOOLS

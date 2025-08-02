# CoSync - Real-time Collaborative Code Editor

A real-time collaborative code editor built with Next.js and Socket.IO that allows multiple users to edit code simultaneously.

## Features

- Real-time collaborative editing
- Live cursor tracking
- Room-based collaboration
- Automatic reconnection handling
- Connection status indicators

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development environment:

**Option 1: Use the provided scripts**
```bash
# Windows (PowerShell)
.\start-dev.ps1

# Windows (Command Prompt)
start-dev.bat
```

**Option 2: Manual start**
```bash
# Terminal 1 - Start the Socket.IO server
npm run server

# Terminal 2 - Start the Next.js client
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting Connection Issues

If you experience room disconnections or connection issues:

1. **Ensure both server and client are running**
   - Server should be on port 5000
   - Client should be on port 3000

2. **Check firewall settings**
   - Make sure ports 3000 and 5000 are not blocked

3. **Clear browser cache**
   - Hard refresh (Ctrl+F5) or clear browser cache

4. **Check network connectivity**
   - Ensure stable internet connection
   - Try disabling VPN if using one

5. **Use the Reconnect button**
   - If disconnected, use the yellow "Reconnect" button in the sidebar

6. **Monitor connection status**
   - Green dot = Connected
   - Red dot = Disconnected

## Development

The project uses:
- [Next.js](https://nextjs.org) for the frontend
- [Socket.IO](https://socket.io) for real-time communication
- [CodeMirror](https://codemirror.net) for the code editor
- [Tailwind CSS](https://tailwindcss.com) for styling

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

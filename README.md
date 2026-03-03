# Upload MCP Server

A MCP App that provides a file upload widget for images.
Supports both OpenAI Apps SDK and the MCP Apps SDK.

## Features

- **upload_to_model** tool: Opens a React widget with a file chooser for uploading PNG, JPEG, or WebP images
- Uses OpenAI Apps SDK `window.openai.uploadFile()` API
- Built with Express and StreamableHTTPServerTransport
- Inline widget embedding for simplicity

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the widget:**
   ```bash
   pnpm build:widget
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Usage

The server will start at `http://127.0.0.1:3000/mcp`

### Connecting from ChatGPT

1. Go to ChatGPT settings
2. Add a new app connection
3. Enter the server URL: `http://127.0.0.1:3000/mcp`
4. Use the `upload_to_model` tool in your conversation

## Scripts

- `pnpm build:widget` - Bundle the React widget component
- `pnpm build` - Build both widget and server
- `pnpm dev` - Build widget and start server in development mode
- `pnpm start` - Build and start server in production mode

## Project Structure

```
upload-mcp/
├── src/
│   ├── server.ts              # MCP server with Express
│   └── web/
│       ├── FileUpload.tsx     # React upload widget
│       └── dist/
│           └── component.js   # Bundled widget (generated)
├── package.json
└── tsconfig.json
```

## Customization

### Post-Upload Processing

Edit the TODO section in [src/server.ts](src/server.ts) to add your custom logic after a file is uploaded:

```typescript
// TODO: Add your post-upload processing logic here
console.log('Received file upload:', fileId);
// - Process the fileId
// - Store it in a database
// - Pass it to another service
// - Generate a response based on the uploaded file
```

### Widget Styling

Modify [src/web/FileUpload.tsx](src/web/FileUpload.tsx) to customize the upload widget UI.

## File Type Restrictions

Currently supports:
- image/png
- image/jpeg
- image/webp

To support additional file types, update both:
1. The `accept` attribute in FileUpload.tsx
2. The `allowedTypes` array in the validation logic

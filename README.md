# Upload MCP Server (Dual Host Image Upload Testbed)

This repository is a Model Context Protocol server used to test how MCP hosts handle image-related model context updates.
It serves one tool, `upload_to_model`, with two host-specific widget experiences:

- ChatGPT Developer Mode widget
- MCP Apps SDK widget

The implementation is intentionally focused on host behavior validation (upload bridge, model context updates, image payload handling), not production hardening.

## Tool Contract

- Tool name: `upload_to_model`
- Input schema: empty object (`{}`)
- Tool output: instruction text plus host-specific widget behavior for image upload/model context handling

The tool registers two UI resources through metadata:

- ChatGPT widget via `_meta['openai/outputTemplate']`
- MCP App widget via `_meta.ui.resourceUri`

## Architecture Overview

- Shared UI component: `src/web/FileUpload.tsx`
- ChatGPT adapter: `src/web/file-upload-chatgpt.tsx`
  - Uploads with `window.openai.uploadFile(file)`
  - Optionally resolves preview with `window.openai.getFileDownloadUrl({ fileId })`
  - Sets widget state with `imageIds: [fileId]`
- MCP App adapter: `src/web/file-upload-mcp.tsx`
  - Uses `useApp()` from `@modelcontextprotocol/ext-apps/react`
  - Sends `updateModelContext({ content })` with text + image blocks
  - Falls back to text-only context when the host rejects image payloads

## Supported Image Types and Normalization

- File picker accepts: `image/png`, `image/jpeg`, `image/webp`
- For MCP model payloads, supported model mime types are PNG and JPEG.
- If an uploaded file is not directly supported for model context (for example WebP), the client normalizes it to PNG before sending.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Build both widgets:
   ```bash
   pnpm build:widget
   ```
3. Start local development server:
   ```bash
   pnpm dev
   ```

Local MCP endpoint:

`http://127.0.0.1:3000/mcp`

## Scripts

- `pnpm build:widget`: Build both widget variants (ChatGPT + MCP App)
- `pnpm build:widget:chatgpt`: Build ChatGPT widget only
- `pnpm build:widget:mcp`: Build MCP App widget only
- `pnpm build`: Build widgets, then compile server with `tsc`
- `pnpm dev`: Build widgets, then run server with `tsx`
- `pnpm start`: Build everything, then run compiled server from `dist/server.js`

## Manual Smoke Test

1. Run `pnpm dev`
2. Connect your host/client to `http://127.0.0.1:3000/mcp`
3. Invoke `upload_to_model`
4. Upload PNG, JPEG, and WebP files
5. Confirm expected behavior:
   - Upload success feedback in widget
   - Preview rendering when available
   - MCP App mode fallback to text-only context if image content is rejected

## Project Structure

```text
upload-mcp/
├── src/
│   ├── server.ts                    # MCP server, tool/resource registration
│   └── web/
│       ├── FileUpload.tsx           # Shared upload UI
│       ├── file-upload-chatgpt.tsx  # ChatGPT adapter
│       ├── file-upload-mcp.tsx      # MCP App adapter
│       ├── chatgpt-app.html         # ChatGPT widget entry HTML
│       ├── mcp-app.html             # MCP widget entry HTML
│       └── vite.config.ts           # Widget bundling config
├── dist/
│   ├── server.js
│   └── ui/web/src/web/*.html        # Built single-file widget artifacts
├── package.json
└── tsconfig.json
```

## Troubleshooting

- Missing UI bundle errors in tool/resource responses:
  - Run `pnpm build:widget` to regenerate `dist/ui/web/src/web/*.html`
- MCP App bridge not ready (`MCP App bridge is not ready yet. Please try again.`):
  - Retry after host bridge initialization completes
- ChatGPT file IDs may include `sediment://` prefix:
  - Keep and pass the raw `fileId` in `imageIds`; `getFileDownloadUrl` resolves it correctly

## Security and Runtime Notes

- This project is primarily for MCP host capability testing around image model context updates.
- CORS is currently permissive (`origin: '*'`) for easier host integration during testing.
- For production usage, tighten CORS/origin policy and review network binding and deployment settings before exposing publicly.

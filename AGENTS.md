# Repository Guidelines

## Project Structure & Module Organization
- `src/server.ts` contains the MCP server (Express + MCP SDK) and tool definitions.
- `src/web/FileUpload.tsx` is the React upload widget; `src/web/chatgpt-app.html` is the widget entry HTML.
- `src/web/vite.config.ts` controls widget bundling; output lands in `dist/ui/web`.
- `dist/` is generated build output for the server and widget; avoid hand-editing.
- Tests are not currently defined in this repository.

## Build, Test, and Development Commands
- `pnpm build:widget`: Bundle the React widget with Vite into `dist/ui/web`.
- `pnpm build`: Build the widget and compile the server with `tsc`.
- `pnpm dev`: Build the widget and run the server via `tsx` for local development.
- `pnpm start`: Production build + run the compiled server from `dist/server.js`.

## Coding Style & Naming Conventions
- TypeScript (ESM) with 2-space indentation and single quotes; follow existing patterns in `src/`.
- React components use `PascalCase` filenames (e.g., `FileUpload.tsx`).
- No formatter or linter config is present; keep changes consistent with surrounding code.

## Testing Guidelines
- No automated test framework is configured and no coverage target is defined.
- Validate changes manually by running `pnpm dev` and exercising the `upload_to_model` tool.

## Commit & Pull Request Guidelines
- Commit messages in this repo are short, imperative sentences (e.g., “Bind to 0.0.0.0”).
- PRs should include a concise summary, testing notes, and screenshots for widget UI changes.

## Security & Configuration Tips
- The server binds to `0.0.0.0` and enables permissive CORS for ChatGPT access; tighten for production.
- Keep local URLs and API configuration out of source control.

## Notes
- In ChatGPT Developer Mode, uploaded file IDs may include the `sediment://` prefix; keep the raw ID for `imageIds` because `getFileDownloadUrl` resolves it.

## Agent-Specific Instructions
- Do not edit files under `dist/` directly; regenerate them with `pnpm build:widget` or `pnpm build`.

import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import cors from 'cors';

const MCP_PORT = Number(process.env.PORT ?? 3000);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const CHATGPT_WIDGET_URI = 'ui://widget/file-upload-chatgpt.html';
const MCP_APP_WIDGET_URI = 'ui://widget/file-upload-mcp-app.html';
const CHATGPT_MIME_TYPE = 'text/html+skybridge';

function loadUiBundle(resourceUri: string, mimeType: string, bundlePath: string): ReadResourceResult {
  const uiPath = join(DIST_DIR, bundlePath);
  try {
    const html = readFileSync(uiPath, 'utf-8');
    return {
      contents: [{
        uri: resourceUri,
        mimeType,
        text: html,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load widget HTML from ${uiPath}: ${message}`);
    return {
      contents: [{
        uri: resourceUri,
        mimeType,
        text: `<!doctype html><html><body><pre>Missing UI bundle at ${uiPath}: ${message}</pre></body></html>`,
      }],
    };
  }
}

// Create the MCP server
function createServer(): McpServer {
  const server = new McpServer({
    name: 'upload-mcp-server',
    version: '1.0.0',
  });

  // Register MCP Apps resource
  registerAppResource(
    server,
    'file-upload-widget-mcp-app',
    MCP_APP_WIDGET_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: 'File Upload Widget (MCP App)',
    },
    async () => loadUiBundle(
      MCP_APP_WIDGET_URI,
      RESOURCE_MIME_TYPE,
      'ui/web/src/web/mcp-app.html',
    ),
  );

  // Register ChatGPT widget resource
  server.registerResource(
    'file-upload-widget-chatgpt',
    CHATGPT_WIDGET_URI,
    {
      mimeType: CHATGPT_MIME_TYPE,
      description: 'File Upload Widget (ChatGPT)',
    },
    async () => loadUiBundle(
      CHATGPT_WIDGET_URI,
      CHATGPT_MIME_TYPE,
      'ui/web/src/web/chatgpt-app.html',
    ),
  );

  // Register the upload_to_model tool with dual metadata pointers
  registerAppTool(
    server,
    'upload_to_model',
    {
      description: 'Displays the file chooser to upload an image file (PNG, JPEG, or WebP) to the model',
      inputSchema: z.object({}),
      annotations: {
        openWorldHint: true,
      },
      _meta: {
        ui: { resourceUri: MCP_APP_WIDGET_URI },
        'openai/outputTemplate': CHATGPT_WIDGET_URI,
      },
    },
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Please select an image file to upload using the widget below.',
          },
        ],
      };
    },
  );

  return server;
}

// Create Express app with MCP - bind to all interfaces for ngrok access
const app = createMcpExpressApp({ host: '0.0.0.0' });

// Enable CORS for all origins (required for ChatGPT to access via ngrok)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
  credentials: true,
}));

// Handle MCP requests in stateless mode (like brave-search-mcp)
app.post('/mcp', async (req, res) => {
  // Create fresh server and transport for each request
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // Clean up when response ends
  res.on('close', () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// Start the server
app.listen(MCP_PORT, '0.0.0.0', () => {
  console.log(`MCP server listening on http://0.0.0.0:${MCP_PORT}/mcp`);
  console.log('Ready to accept connections from ChatGPT');
});

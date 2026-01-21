import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import cors from 'cors';

const MCP_PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

// Create the MCP server
function createServer(): McpServer {
  const server = new McpServer({
    name: 'upload-mcp-server',
    version: '1.0.0',
  });

  // Register the widget as a resource with ChatGPT-compatible MIME type
  server.registerResource(
    'file-upload-widget',
    'ui://widget/file-upload.html',
    { 
      mimeType: 'text/html+skybridge', 
      description: 'File Upload Widget' 
    },
    async () => {
      const uiPath = join(DIST_DIR, 'ui/web/src/web/chatgpt-app.html');
      try {
        const html = readFileSync(uiPath, 'utf-8');
        return {
          contents: [{
            uri: 'ui://widget/file-upload.html',
            mimeType: 'text/html+skybridge',
            text: html,
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load widget HTML from ${uiPath}: ${message}`);
        return {
          contents: [{
            uri: 'ui://widget/file-upload.html',
            mimeType: 'text/html+skybridge',
            text: `<!doctype html><html><body><pre>Missing UI bundle at ${uiPath}: ${message}</pre></body></html>`,
          }],
        };
      }
    },
  );

  // Register the upload_to_model tool
  server.registerTool(
    'upload_to_model',
    {
      description: 'Displays the file chooser to upload an image file (PNG, JPEG, or WebP) to the model',
      inputSchema: z.object({}),
      annotations: {
        openWorldHint: true,
      },
      _meta: {
        'openai/outputTemplate': 'ui://widget/file-upload.html',
      },
    },
    async () => {
      // Return simple text response - the widget is already registered via outputTemplate
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Please select an image file to upload using the widget below.',
          },
        ],
      };
    }
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
app.listen(MCP_PORT, '127.0.0.1', () => {
  console.log(`MCP server listening on http://127.0.0.1:${MCP_PORT}/mcp`);
  console.log('Ready to accept connections from ChatGPT');
});

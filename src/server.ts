import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import cors from 'cors';

const MCP_PORT = 3000;

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Read the bundled widget component
let widgetBundle: string;
try {
  widgetBundle = readFileSync(join(process.cwd(), 'src/web/dist/component.js'), 'utf-8');
} catch (error) {
  console.error('Failed to read widget bundle. Make sure to run "pnpm build:widget" first.');
  process.exit(1);
}

// Create the MCP server
function createServer(): McpServer {
  const server = new McpServer({
    name: 'upload-mcp-server',
    version: '1.0.0',
  });

  // Register the upload_to_model tool
  server.registerTool(
    'upload_to_model',
    {
      description: 'Upload an image file (PNG, JPEG, or WebP) to the model',
      inputSchema: z.object({
        fileId: z.string().optional().describe('The file ID from a previous upload'),
      }),
    },
    async ({ fileId }) => {
      // TODO: Add your post-upload processing logic here
      // This stub is called when the widget uploads a file
      // You can:
      // - Process the fileId
      // - Store it in a database
      // - Pass it to another service
      // - Generate a response based on the uploaded file
      
      console.log('Received file upload:', fileId);

      // Return the widget UI with embedded component
      return {
        content: [
          {
            type: 'text' as const,
            text: fileId 
              ? `File received: ${fileId}. You can now process this file.`
              : 'Please select an image file to upload.',
          },
        ],
        metadata: {
          'openai/widgetDomain': 'https://chatgpt.com',
          'openai/widgetCSP': {
            connect_domains: ['https://chatgpt.com'],
            resource_domains: ['https://*.oaistatic.com'],
          },
          'openai/component': {
            type: 'inline',
            template: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                  <div id="root"></div>
                  <script type="module">
                    ${widgetBundle}
                  </script>
                </body>
              </html>
            `,
          },
        },
      };
    }
  );

  return server;
}

// Create Express app with MCP (allow ngrok hostname)
const app = createMcpExpressApp({
  allowedHosts: ['127.0.0.1', 'localhost', 'bertie-gnomonic-solomon.ngrok-free.dev'],
});

// Enable CORS for all origins (required for ChatGPT to access via ngrok)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
  credentials: true,
}));

// Handle MCP requests
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport for this session
    transport = transports[sessionId];
  } else {
    // Create a new transport for a new session
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
        console.log('Session initialized:', sid);
      },
    });

    // Set the onclose handler after creation
    const closeHandler = () => {
      const sid = transport.sessionId;
      if (sid && transports[sid]) {
        delete transports[sid];
        console.log('Session closed:', sid);
      }
    };
    transport.onclose = closeHandler;

    const server = createServer();
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});

// Start the server
app.listen(MCP_PORT, '127.0.0.1', () => {
  console.log(`MCP server listening on http://127.0.0.1:${MCP_PORT}/mcp`);
  console.log('Ready to accept connections from ChatGPT');
});

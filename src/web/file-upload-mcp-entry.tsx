import { createRoot } from 'react-dom/client';
import McpFileUploadWidget from './file-upload-mcp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(<McpFileUploadWidget />);

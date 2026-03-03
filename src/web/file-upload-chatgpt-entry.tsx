import { createRoot } from 'react-dom/client';
import ChatGptFileUploadWidget from './file-upload-chatgpt';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(<ChatGptFileUploadWidget />);

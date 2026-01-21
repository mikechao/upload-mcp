import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Extend Window interface to include openai
declare global {
  interface Window {
    openai?: {
      uploadFile: (file: File) => Promise<{ fileId: string }>;
      callTool: (toolName: string, args: Record<string, any>) => Promise<void>;
      setWidgetState: (state: any) => void;
      sendFollowUpMessage: (options: { prompt: string }) => Promise<void>;
    };
  }
}

function FileUploadWidget() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select PNG, JPEG, or WebP images only.');
      return;
    }

    console.log('[File Upload] Selected file:', file.name, file.type, file.size);
    setError(null);
    setUploading(true);

    try {
      console.log('[File Upload] Starting upload...');
      
      // Access directly from window.openai (functions are set at init, not via events)
      if (!window.openai?.uploadFile) {
        throw new Error('Upload API not available');
      }

      console.log('[File Upload] Calling window.openai.uploadFile...');
      const uploadResult = await window.openai.uploadFile(file);
      console.log('[File Upload] Upload result:', uploadResult);
      console.log('[File Upload] Upload result stringified:', JSON.stringify(uploadResult, null, 2));
      
      const uploadedFileId = uploadResult.fileId;
      console.log('[File Upload] Extracted fileId:', uploadedFileId);
      setFileId(uploadedFileId);

      // Set widget state with the uploaded image
      console.log('[File Upload] Setting widget state...');
      if (window.openai.setWidgetState) {
        window.openai.setWidgetState({
          modelContent: {
            imageIds: [uploadedFileId],
          },
          privateContent: {},
          imageIds: [uploadedFileId],
        });
        console.log('[File Upload] Widget state set');
      }

      // Wait for next frame to ensure state is set
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Send follow-up message to trigger analysis
      console.log('[File Upload] Sending follow-up message...');
      if (window.openai.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({
          prompt: 'Please describe what you see.',
        });
        console.log('[File Upload] Follow-up message sent');
      }

      console.log('[File Upload] File uploaded successfully:', uploadedFileId);
      
    } catch (err) {
      console.error('[File Upload] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '400px'
    }}>
      <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600 }}>Upload Image</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          style={{
            display: 'block',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        />
      </div>

      {uploading && (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Uploading...
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#d32f2f', 
          fontSize: '14px',
          padding: '8px',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          marginTop: '8px'
        }}>
          {error}
        </div>
      )}

      {fileId && (
        <div style={{ 
          color: '#2e7d32', 
          fontSize: '14px',
          padding: '8px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          marginTop: '8px'
        }}>
          ✓ File uploaded successfully!
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
            File ID: {fileId}
          </div>
        </div>
      )}

      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #eee'
      }}>
        Supported formats: PNG, JPEG, WebP
      </div>
    </div>
  );
}

// Mount the component when the script loads
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<FileUploadWidget />);
}

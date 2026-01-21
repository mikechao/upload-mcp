import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Extend Window interface to include openai
declare global {
  interface Window {
    openai?: {
      uploadFile: (file: File) => Promise<{ fileId: string }>;
      callTool: (toolName: string, args: Record<string, any>) => Promise<void>;
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
      setError(`Invalid file type. Please select PNG, JPEG, or WebP images only.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (!window.openai?.uploadFile) {
        throw new Error('Upload API not available');
      }

      const { fileId: uploadedFileId } = await window.openai.uploadFile(file);
      setFileId(uploadedFileId);

      // Call the tool with the uploaded fileId
      // This allows the server to process the uploaded file
      if (window.openai?.callTool) {
        await window.openai.callTool('upload_to_model', { fileId: uploadedFileId });
      }

      // TODO: Add your post-upload processing here
      // This is where you can handle the uploaded file
      // Examples:
      // - Send fileId to your backend for processing
      // - Display a preview of the uploaded image
      // - Trigger additional workflows
      console.log('File uploaded successfully:', uploadedFileId);
      
    } catch (err) {
      console.error('Upload error:', err);
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

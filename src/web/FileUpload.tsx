import type { ChangeEvent } from 'react';

interface FileUploadViewProps {
  uploading: boolean;
  error: string | null;
  successMessage: string | null;
  successDetail: string | null;
  previewUrl: string | null;
  onFileSelected: (file: File) => Promise<void>;
}

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export function getFileTypeError(file: File): string | null {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return null;
  }
  return 'Invalid file type. Please select PNG, JPEG, or WebP images only.';
}

export function FileUploadView({
  uploading,
  error,
  successMessage,
  successDetail,
  previewUrl,
  onFileSelected,
}: FileUploadViewProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) {
      return;
    }
    await onFileSelected(file);
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '400px',
    }}>
      <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600 }}>Upload Image</h2>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={(event) => {
            void handleFileChange(event);
          }}
          disabled={uploading}
          style={{
            display: 'block',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        />
      </div>

      <div style={{
        fontSize: '12px',
        color: '#666',
        marginBottom: '12px',
      }}>
        After uploading, ask a follow-up question about the image.
      </div>

      {previewUrl && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
            Preview
          </div>
          <img
            src={previewUrl}
            alt="Uploaded preview"
            style={{ width: '100%', borderRadius: '6px', border: '1px solid #e0e0e0' }}
          />
        </div>
      )}

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
          marginTop: '8px',
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          color: '#2e7d32',
          fontSize: '14px',
          padding: '8px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          marginTop: '8px',
        }}>
          {successMessage}
          {successDetail && (
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
              {successDetail}
            </div>
          )}
        </div>
      )}

      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #eee',
      }}>
        Supported formats: PNG, JPEG, WebP
      </div>
    </div>
  );
}

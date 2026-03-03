import type { ContentBlock } from '@modelcontextprotocol/sdk/types.js';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { useState } from 'react';
import { FileUploadView, getFileTypeError } from './FileUpload';
import { blobToBase64, normalizeBlobForModel } from './file-upload-mcp-utils';

const APP_INFO = { name: 'Upload MCP Widget', version: '1.0.0' };

export default function McpFileUploadWidget() {
  const { app, error: appError } = useApp({
    appInfo: APP_INFO,
    capabilities: {},
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successDetail, setSuccessDetail] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    const fileTypeError = getFileTypeError(file);
    if (fileTypeError) {
      setError(fileTypeError);
      return;
    }

    if (!app) {
      setError('MCP App bridge is not ready yet. Please try again.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setSuccessDetail(null);
    setUploading(true);
    setPreviewUrl(null);

    const textOnlyContent: ContentBlock[] = [
      { type: 'text', text: 'User uploaded an image from the file upload widget.' },
    ];

    try {
      const previewData = await blobToBase64(file);
      setPreviewUrl(`data:${file.type};base64,${previewData}`);

      const { blob, mimeType } = await normalizeBlobForModel(file);
      const imageData = await blobToBase64(blob);
      const contentWithImage: ContentBlock[] = [
        ...textOnlyContent,
        {
          type: 'image',
          data: imageData,
          mimeType,
        },
      ];

      try {
        await app.updateModelContext({ content: contentWithImage });
      } catch (contextError) {
        console.warn(
          'Host rejected image context payload. Falling back to text-only context.',
          contextError,
        );
        await app.updateModelContext({ content: textOnlyContent });
      }

      setSuccessMessage('✓ Image added to model context.');
      setSuccessDetail(`Model payload mime type: ${mimeType}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to update model context');
    } finally {
      setUploading(false);
    }
  };

  const combinedError = appError ? appError.message : error;

  return (
    <FileUploadView
      uploading={uploading}
      error={combinedError}
      successMessage={successMessage}
      successDetail={successDetail}
      previewUrl={previewUrl}
      onFileSelected={handleFileSelected}
    />
  );
}

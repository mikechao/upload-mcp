import { useState } from 'react';
import { FileUploadView, getFileTypeError } from './FileUpload';

const DEFAULT_ADDITIONAL_TEXT = 'User uploaded an image from the file upload widget.';

declare global {
  interface Window {
    openai?: {
      uploadFile?: (file: File) => Promise<{ fileId: string }>;
      getFileDownloadUrl?: (args: { fileId: string }) => Promise<{ downloadUrl: string }>;
      callTool?: (toolName: string, args: Record<string, unknown>) => Promise<void>;
      setWidgetState?: (state: unknown) => void;
    };
  }
}

export default function ChatGptFileUploadWidget() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalText, setAdditionalText] = useState(DEFAULT_ADDITIONAL_TEXT);

  const handleFileSelected = async (file: File) => {
    const fileTypeError = getFileTypeError(file);
    if (fileTypeError) {
      setError(fileTypeError);
      return;
    }

    setError(null);
    setFileId(null);
    setPreviewUrl(null);
    setUploading(true);

    try {
      if (!window.openai?.uploadFile) {
        throw new Error('Upload API not available');
      }

      const uploadResult = await window.openai.uploadFile(file);
      const uploadedFileId = uploadResult.fileId;
      const resolvedAdditionalText = additionalText.trim() ? additionalText : DEFAULT_ADDITIONAL_TEXT;
      setFileId(uploadedFileId);

      if (window.openai.setWidgetState) {
        window.openai.setWidgetState({
          modelContent: resolvedAdditionalText,
          privateContent: {
            rawFileId: uploadedFileId,
          },
          imageIds: [uploadedFileId],
        });
      }

      if (window.openai.getFileDownloadUrl) {
        try {
          const { downloadUrl } = await window.openai.getFileDownloadUrl({ fileId: uploadedFileId });
          setPreviewUrl(downloadUrl);
        } catch {
          setPreviewUrl(null);
        }
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <FileUploadView
      uploading={uploading}
      error={error}
      successMessage={fileId ? '✓ File uploaded successfully!' : null}
      successDetail={fileId ? `File ID: ${fileId}` : null}
      previewUrl={previewUrl}
      additionalText={additionalText}
      onAdditionalTextChange={setAdditionalText}
      onFileSelected={handleFileSelected}
    />
  );
}

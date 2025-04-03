import axios from 'axios';
import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onUploadSuccess: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file); // Changed 'file' to 'image' to match backend expectation

    setIsUploading(true);

    try {
      const response = await axios.post<{ url: string }>(
        'http://localhost:4000/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true, // Add this if you need to send cookies
        },
      );

      if (response.data?.url) {
        onUploadSuccess(response.data.url);
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload image';
      onUploadError(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError('Image size should be less than 5MB');
      return;
    }

    // Preview the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png"
        className="hidden"
      />

      <div className="size-32 overflow-hidden rounded-full border-4 border-gray-200">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gray-100">
            <span className="text-sm text-gray-500">No image selected</span>
          </div>
        )}
      </div>

      <button
        onClick={handleClick}
        disabled={isUploading}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isUploading ? 'Uploading...' : 'Choose Image'}
      </button>
    </div>
  );
};

export default ImageUpload;

import { API_URL } from '@/config/api';

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: any,
        callback: (error: any, result: any) => void,
      ) => {
        open: () => void;
        close: () => void;
      };
    };
  }
}

const CLOUDINARY_SCRIPT_URL =
  'https://upload-widget.cloudinary.com/global/all.js';

export const useCloudinaryWidget = () => {
  const loadScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.cloudinary) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = CLOUDINARY_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Cloudinary script'));
      document.body.appendChild(script);
    });
  };

  const uploadToCloudinary = async (
    source: 'local' | 'camera',
  ): Promise<string> => {
    try {
      await loadScript();

      return await new Promise((resolve, reject) => {
        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
            sources: [source],
            multiple: false,
            maxFileSize: 5000000, // 5MB
            resourceType: 'image',
            folder: 'choir_members',
            showUploadMoreButton: false,
            showAdvancedOptions: false,
            singleUploadAutoClose: true,
            language: 'fr',
            text: {
              fr: {
                queue: {
                  title:
                    source === 'local'
                      ? 'Choisir une photo'
                      : 'Prendre une photo',
                  title_for_uploading: 'Téléchargement en cours...',
                  title_for_failed: 'Échec du téléchargement',
                  title_for_success: 'Téléchargement réussi',
                },
                local: {
                  browse: 'Parcourir',
                  dd_title_single: 'Choisir une photo',
                  dd_title_multiple: 'Choisir une photo',
                  drop_title_single: 'Choisir une photo',
                  drop_title_multiple: 'Choisir une photo',
                },
                camera: {
                  capture: 'Prendre une photo',
                  switch_camera: 'Changer de caméra',
                  take_photo: 'Prendre la photo',
                  retake: 'Reprendre',
                  done: 'Terminé',
                },
              },
            },
            clientAllowedFormats: ['jpg', 'jpeg', 'png'],
            maxChunkSize: 2000000,
            maxImageFileSize: 5000000,
            secure: true,
            secureDistribution: 'res.cloudinary.com',
            use_filename: true,
            unique_filename: true,
            invalidate: true,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [
              { width: 400, height: 400, crop: 'fill' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error: any, result: any) => {
            if (error) {
              console.error('Error uploading to Cloudinary:', error);
              reject(error);
            } else if (result && result.event === 'success') {
              resolve(result.info.secure_url);
            }
          },
        );

        widget.open();
      });
    } catch (error) {
      console.error('Error initializing Cloudinary widget:', error);
      throw error;
    }
  };

  return { uploadToCloudinary };
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  if (!arr || arr.length < 2) {
    throw new Error('Invalid data URL format');
  }

  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1] || '');
  const u8arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i += 1) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
};

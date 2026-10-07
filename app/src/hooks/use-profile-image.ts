import { useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

/** Cambia o elimina la foto de perfil del usuario en Clerk. */
export function useProfileImage() {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<void>) => {
    setError('');
    setIsUploading(true);
    try {
      await action();
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage || err?.message || 'No se pudo actualizar la foto de perfil.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const pickAndUpload = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    if (!asset.base64) {
      setError('No se pudo leer la imagen seleccionada.');
      return;
    }

    await run(async () => {
      await user.setProfileImage({
        file: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`,
      });
    });
  };

  const removeImage = async () => {
    if (!user) return;
    await run(async () => {
      await user.setProfileImage({ file: null });
    });
  };

  return { pickAndUpload, removeImage, isUploading, error, clearError: () => setError('') };
}

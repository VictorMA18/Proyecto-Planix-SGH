import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES, type Attachment } from '@/schemas/task.schema';

import { AttachmentTile } from '../detail/AttachmentTile';
import { TaskSection } from '../detail/TaskSection';
import { FieldError } from './FieldLabel';

const MAX_FILES = 10;
let sequence = 0;

interface AttachmentsEditorProps {
  value: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

/** Adjuntos: solo PDF e imágenes de hasta 10 MB (documentacion/03). Quitar uno pide confirmación. */
export const AttachmentsEditor: React.FC<AttachmentsEditorProps> = ({ value, onChange }) => {
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<Attachment | null>(null);

  const pick = async () => {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_ATTACHMENT_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];
    const mimeType = file.mimeType ?? '';

    if (!ALLOWED_ATTACHMENT_TYPES.includes(mimeType)) {
      return setError('Solo se admiten PDF e imágenes (JPG, PNG, WebP o GIF).');
    }
    if ((file.size ?? 0) > MAX_ATTACHMENT_BYTES) return setError('El archivo supera los 10 MB.');

    // Sin backend todavía: se guarda la referencia local. El backend lo subirá a Cloudinary
    // (POST /tareas/{tareaId}/adjuntos).
    onChange([
      ...value,
      {
        id: `adjunto-${Date.now()}-${++sequence}`,
        tipo: mimeType === 'application/pdf' ? 'ARCHIVO' : 'IMAGEN',
        nombreArchivo: file.name,
        mimeType,
        tamanoBytes: file.size ?? 0,
        url: file.uri,
      },
    ]);
  };

  return (
    <TaskSection icon="attach-outline" title={`Archivos adjuntos (${value.length})`}>
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-3">
          {value.map((attachment) => (
            <AttachmentTile key={attachment.id} attachment={attachment} onRemove={() => setRemoving(attachment)} />
          ))}
        </View>
      ) : null}

      {value.length < MAX_FILES ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir archivo. PDF o imagen de hasta 10 MB"
          onPress={pick}
          style={{ borderCurve: 'continuous' }}
          className="min-h-14 flex-row items-center justify-center rounded-2xl border border-dashed border-primary/50 active:bg-tertiary"
        >
          <Ionicons name="add-circle-outline" size={20} color={ThemeColors.primary} />
          <Text className="ml-2 text-sm font-bold text-primary">Añadir archivo</Text>
        </Pressable>
      ) : null}
      <Text className="-mt-2 text-xs text-neutral-muted text-center">PDF o imágenes · máximo 10 MB por archivo</Text>
      <FieldError message={error} />

      <ConfirmModal
        visible={!!removing}
        destructive
        icon="trash-outline"
        title="¿Quitar este archivo?"
        message={removing ? `«${removing.nombreArchivo}» se quitará de la tarea al guardar los cambios.` : undefined}
        confirmLabel="Sí, quitar"
        onConfirm={() => {
          if (removing) onChange(value.filter((a) => a.id !== removing.id));
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </TaskSection>
  );
};

import React, { useEffect, useState } from 'react';

import { AppInput, ConfirmModal } from '@/components/ui';
import { descriptionLinkSchema } from '@/schemas/task.schema';

interface LinkModalProps {
  visible: boolean;
  /** Sin texto seleccionado, se pide el texto que se mostrará. */
  askLabel: boolean;
  onCancel: () => void;
  onConfirm: (link: { url: string; label: string }) => void;
}

/** Pide la dirección (y el texto, si no hay selección) de un enlace de la descripción. */
export const LinkModal: React.FC<LinkModalProps> = ({ visible, askLabel, onCancel, onConfirm }) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<{ label?: string; url?: string }>({});

  useEffect(() => {
    if (visible) {
      setLabel('');
      setUrl('');
      setErrors({});
    }
  }, [visible]);

  const confirm = () => {
    const result = descriptionLinkSchema.safeParse({ label, url });
    if (!result.success) {
      const next: { label?: string; url?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'label' | 'url';
        next[field] ??= issue.message;
      });
      setErrors(next);
      return;
    }
    onConfirm({ url: result.data.url, label: result.data.label || result.data.url.replace(/^https?:\/\//i, '') });
  };

  return (
    <ConfirmModal
      visible={visible}
      title="Agregar enlace"
      message={askLabel ? 'Escribe el texto y la dirección del enlace.' : 'El texto seleccionado llevará a esta dirección.'}
      icon="link"
      confirmLabel="Agregar"
      onConfirm={confirm}
      onCancel={onCancel}
    >
      {askLabel ? (
        <AppInput
          label="Texto"
          leftIcon="text-outline"
          placeholder="Ej.: Manual de marca"
          value={label}
          onChangeText={setLabel}
          error={errors.label}
          maxLength={120}
        />
      ) : null}
      <AppInput
        label="Dirección"
        leftIcon="link-outline"
        placeholder="www.ejemplo.com"
        value={url}
        onChangeText={setUrl}
        error={errors.url}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onSubmitEditing={confirm}
      />
    </ConfirmModal>
  );
};

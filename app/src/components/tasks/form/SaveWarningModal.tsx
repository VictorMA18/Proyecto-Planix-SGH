import React from 'react';

import { ConfirmModal } from '@/components/ui';
import type { SaveTaskResult } from '@/services/tasks';

interface SaveWarningModalProps {
  failed: SaveTaskResult['failed'] | null;
  onClose: () => void;
}

/** La tarea se guardó, pero algún adjunto no se pudo subir o quitar: se dice cuál y por qué. */
export const SaveWarningModal: React.FC<SaveWarningModalProps> = ({ failed, onClose }) => (
  <ConfirmModal
    visible={!!failed && failed.length > 0}
    icon="alert-circle-outline"
    title="La tarea se guardó, pero…"
    message={`${(failed ?? []).map((f) => `• ${f.nombre}: ${f.motivo}`).join('\n')}\n\nPuedes volver a intentarlo desde «Editar».`}
    confirmLabel="Entendido"
    hideCancel
    onConfirm={onClose}
    onCancel={onClose}
  />
);

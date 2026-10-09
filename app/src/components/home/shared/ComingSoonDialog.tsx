import React from 'react';

import { ConfirmModal } from '@/components/ui';

interface ComingSoonDialogProps {
  /** Qué función se intentó abrir; `null` cierra el diálogo. */
  feature: { title: string; message: string } | null;
  onClose: () => void;
}

/** Aviso para las acciones cuyo backend llega en una fase posterior. */
export const ComingSoonDialog: React.FC<ComingSoonDialogProps> = ({ feature, onClose }) => (
  <ConfirmModal
    visible={!!feature}
    icon="time-outline"
    title={feature?.title ?? ''}
    message={feature?.message}
    confirmLabel="Entendido"
    hideCancel
    onConfirm={onClose}
    onCancel={onClose}
  />
);

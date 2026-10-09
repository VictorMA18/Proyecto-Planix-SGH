import React, { useEffect, useState } from 'react';

import { ConfirmModal } from '@/components/ui';
import type { ShiftTemplate } from '@/schemas/attendance.schema';
import { useDeleteShift } from '@/services/attendance';

interface DeleteShiftModalProps {
  /** Plantilla a eliminar; `null` cierra el modal. */
  template: ShiftTemplate | null;
  /** Se llama tras eliminar (p. ej. para salir del detalle). */
  onDeleted?: () => void;
  onClose: () => void;
}

/** Confirmación centrada antes de eliminar una plantilla de turno. */
export const DeleteShiftModal: React.FC<DeleteShiftModalProps> = ({ template, onDeleted, onClose }) => {
  const deleteShift = useDeleteShift();
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    deleteShift.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  if (!template) return null;

  const handleConfirm = async () => {
    setError('');
    try {
      await deleteShift.mutateAsync(template.id);
      onClose();
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la plantilla.');
    }
  };

  return (
    <ConfirmModal
      visible
      destructive
      icon="trash-outline"
      title={`¿Eliminar «${template.nombre}»?`}
      message={
        template.asignados > 0
          ? `${template.asignados} ${template.asignados === 1 ? 'persona quedará' : 'personas quedarán'} sin turno asignado. Esta acción no se puede deshacer.`
          : 'Esta acción no se puede deshacer.'
      }
      confirmLabel="Sí, eliminar plantilla"
      isLoading={deleteShift.isPending}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
};

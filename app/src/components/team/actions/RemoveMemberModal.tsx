import React, { useEffect, useState } from 'react';

import { ConfirmModal } from '@/components/ui';
import type { TeamRole } from '@/schemas/team.schema';
import { useRemoveMember } from '@/services/team';

interface RemoveMemberModalProps {
  /** Miembro a quitar; `null` cierra el modal. */
  member: { id: string; nombre: string; rol: TeamRole } | null;
  organizationName: string;
  /** Se llama tras quitar al miembro (p. ej. para salir de su perfil). */
  onRemoved?: () => void;
  onClose: () => void;
}

/** Confirmación centrada antes de quitar a un miembro del equipo. */
export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  member,
  organizationName,
  onRemoved,
  onClose,
}) => {
  const removeMember = useRemoveMember();
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    removeMember.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  if (!member) return null;

  const handleConfirm = async () => {
    setError('');
    try {
      await removeMember.mutateAsync(member.id);
      onClose();
      onRemoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar al miembro.');
    }
  };

  return (
    <ConfirmModal
      visible
      destructive
      icon="person-remove-outline"
      title={`¿Quitar a ${member.nombre} del equipo?`}
      message={`Perderá el acceso a ${organizationName}. Su historial se conserva y podrás volver a invitar a esta persona cuando quieras.`}
      confirmLabel="Sí, quitar del equipo"
      isLoading={removeMember.isPending}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
};

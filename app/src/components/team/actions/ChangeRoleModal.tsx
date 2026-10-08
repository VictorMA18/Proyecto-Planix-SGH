import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { ConfirmModal } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { changeRoleSchema, type InviteRole, type TeamRole } from '@/schemas/team.schema';
import { useChangeMemberRole } from '@/services/team';

import { RolePicker } from '../RolePicker';

interface ChangeRoleModalProps {
  /** Miembro al que se le cambia el rol; `null` cierra el modal. */
  member: { id: string; nombre: string; rol: TeamRole } | null;
  onClose: () => void;
}

/** Elegir el nuevo rol y confirmar el cambio (inmediato) en un diálogo centrado. */
export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ member, onClose }) => {
  const changeRole = useChangeMemberRole();
  const [role, setRole] = useState<InviteRole | undefined>(undefined);
  const [error, setError] = useState('');

  // Cada vez que se abre, empieza sin selección ni errores.
  useEffect(() => {
    setRole(undefined);
    setError('');
    changeRole.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  if (!member) return null;

  const isSame = role === member.rol;

  const handleConfirm = async () => {
    setError('');
    const result = changeRoleSchema.safeParse({ rol: role });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Selecciona un rol.');
      return;
    }

    try {
      await changeRole.mutateAsync({ memberId: member.id, rol: result.data.rol });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol.');
    }
  };

  return (
    <ConfirmModal
      visible
      icon="swap-horizontal-outline"
      title={`¿Cambiar el rol de ${member.nombre}?`}
      message="El cambio es inmediato y modifica lo que puede hacer en la organización."
      confirmLabel="Sí, cambiar rol"
      confirmDisabled={!role || isSame}
      isLoading={changeRole.isPending}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <RolePicker
        value={role}
        onChange={(next) => {
          setRole(next);
          setError('');
        }}
      />
      <Text className="text-xs text-neutral-muted -mt-2">
        {role && !isSame
          ? `${ROLE_NAME[member.rol]} → ${ROLE_NAME[role]}`
          : `Rol actual: ${ROLE_NAME[member.rol]}`}
      </Text>
    </ConfirmModal>
  );
};

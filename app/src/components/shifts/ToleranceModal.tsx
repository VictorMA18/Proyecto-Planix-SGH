import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { ChoiceChips, ConfirmModal } from '@/components/ui';
import { TOLERANCE_OPTIONS } from '@/schemas/attendance.schema';
import { useUpdateTolerance } from '@/services/attendance';

interface ToleranceModalProps {
  visible: boolean;
  current: number;
  onClose: () => void;
}

/** Elegir la tolerancia de entrada de la organización. */
export const ToleranceModal: React.FC<ToleranceModalProps> = ({ visible, current, onClose }) => {
  const update = useUpdateTolerance();
  const [value, setValue] = useState(current);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setValue(current);
      setError('');
    }
  }, [visible, current]);

  const options = TOLERANCE_OPTIONS.includes(current as (typeof TOLERANCE_OPTIONS)[number])
    ? [...TOLERANCE_OPTIONS]
    : [...TOLERANCE_OPTIONS, current].sort((a, b) => a - b);

  return (
    <ConfirmModal
      visible={visible}
      icon="timer-outline"
      title="Tolerancia de entrada"
      message="Minutos de gracia después del inicio del turno para que la entrada cuente como puntual. Aplica a las entradas que se registren desde ahora."
      confirmLabel="Guardar"
      confirmDisabled={value === current}
      isLoading={update.isPending}
      error={error}
      onConfirm={() =>
        update.mutate(value, {
          onSuccess: onClose,
          onError: (err) => setError(err.message),
        })
      }
      onCancel={onClose}
    >
      <ChoiceChips
        label="Minutos"
        value={value}
        onChange={setValue}
        options={options.map((min) => ({ value: min, label: min === 0 ? 'Sin tolerancia' : `${min} min` }))}
      />
      <Text className="-mt-2 mb-2 text-xs text-neutral-muted">
        Las jornadas ya registradas conservan la puntualidad con la que se evaluaron.
      </Text>
    </ConfirmModal>
  );
};

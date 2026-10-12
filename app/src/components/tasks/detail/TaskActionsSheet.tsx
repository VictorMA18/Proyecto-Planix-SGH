import React from 'react';
import { Text } from 'react-native';

import { ActionSheet, ActionSheetItem } from '@/components/ui';

interface TaskActionsSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** Menú ⋮ de una tarea (ADMIN y SUPERVISOR): duplicar o eliminar. */
export const TaskActionsSheet: React.FC<TaskActionsSheetProps> = ({ visible, title, onClose, onDuplicate, onDelete }) => (
  <ActionSheet
    visible={visible}
    onClose={onClose}
    header={
      <Text numberOfLines={2} className="text-base font-extrabold text-neutral">
        {title}
      </Text>
    }
  >
    <ActionSheetItem
      icon="copy-outline"
      label="Duplicar tarea"
      description="Crea una copia con sus personas, etiquetas y subtareas"
      onPress={onDuplicate}
    />
    <ActionSheetItem
      icon="trash-outline"
      label="Eliminar tarea"
      description="Se borran sus comentarios y su actividad"
      destructive
      onPress={onDelete}
    />
  </ActionSheet>
);

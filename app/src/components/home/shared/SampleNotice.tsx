import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

/** Avisa que la asistencia, las métricas y las tareas de esta pantalla son datos de ejemplo. */
export const SampleNotice: React.FC = () => (
  <View
    accessible
    accessibilityLabel="Vista previa con datos de ejemplo"
    style={{ borderCurve: 'continuous' }}
    className="flex-row items-center bg-amber-100 rounded-2xl px-4 py-3"
  >
    <Ionicons name="flask-outline" size={18} color="#B45309" />
    <Text className="flex-1 ml-3 text-xs text-amber-700">
      <Text className="font-bold">Vista previa:</Text> la asistencia, las métricas y las tareas son datos de
      ejemplo hasta que existan esas funciones.
    </Text>
  </View>
);

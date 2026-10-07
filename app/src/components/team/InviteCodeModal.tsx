import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Share, Text, View } from 'react-native';

import { RoleBadge } from '@/components/organizations';
import { AppButton } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';

import type { GeneratedInvite } from './InviteMemberModal';

interface InviteCodeModalProps {
  invite: GeneratedInvite | null;
  organizationName: string;
  onClose: () => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  invite,
  organizationName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => setCopied(false), [invite]);

  if (!invite) return null;
  const { code, email } = invite;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code.codigo);
    setCopied(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Únete a ${organizationName} en PLANYX con este código de invitación: ${code.codigo}`,
      });
    } catch {
      // Compartir no está disponible en este dispositivo o se canceló: no es un error.
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-5">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
        />

        <View
          accessibilityViewIsModal
          style={{ borderCurve: 'continuous' }}
          className="w-full max-w-[420px] bg-cardBg rounded-3xl p-6 items-center"
        >
          <View
            style={{ backgroundColor: ThemeStatus.successBg }}
            className="w-14 h-14 rounded-full items-center justify-center mb-3"
          >
            <Ionicons name="checkmark-circle" size={30} color={ThemeStatus.success} />
          </View>

          <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral mb-1">
            Código de invitación
          </Text>
          <Text className="text-sm text-neutral-muted text-center mb-4">
            {email
              ? `Compártelo con ${email}. Solo esa cuenta podrá usarlo.`
              : 'Cualquier persona con este código se unirá a la organización con el rol indicado.'}
          </Text>

          <View
            style={{ borderCurve: 'continuous' }}
            className="w-full items-center bg-inputBg border border-borderBg rounded-2xl py-5 px-3"
          >
            <Text
              selectable
              accessibilityLabel={`Código ${code.codigo.split('').join(' ')}`}
              style={{ letterSpacing: 4 }}
              className="text-3xl font-extrabold text-primary"
            >
              {code.codigo}
            </Text>
          </View>

          <View className="flex-row flex-wrap items-center justify-center gap-3 mt-4 mb-5">
            <RoleBadge role={code.rol} />
            <Text className="text-xs text-neutral-muted">Vence el {formatDateTime(code.expiraEn)}</Text>
          </View>

          <View className="w-full gap-3">
            <AppButton
              title={copied ? '¡Código copiado!' : 'Copiar código'}
              icon={copied ? 'checkmark' : 'copy-outline'}
              onPress={handleCopy}
            />
            <AppButton title="Compartir" variant="secondary" icon="share-outline" onPress={handleShare} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Listo"
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              className="min-h-11 items-center justify-center"
            >
              <Text style={{ color: ThemeColors.mutedText }} className="text-sm font-semibold">
                Listo
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

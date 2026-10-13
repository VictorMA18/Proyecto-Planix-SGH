import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppInput, UserAvatar } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useKeyboardOverlap } from '@/hooks/use-keyboard-overlap';
import {
  broadcastFormSchema,
  type AppNotification,
  type BroadcastAudience,
  type BroadcastFormInput,
} from '@/schemas/notification.schema';
import { useBroadcastNotice } from '@/services/notifications';
import { useTaskMembers } from '@/services/tasks';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { getInitials } from '@/utils/format';

import { BroadcastRecipients } from './BroadcastRecipients';
import { NotificationCard } from './NotificationCard';

const MESSAGE_MAX = 500;
const EMPTY_FORM: BroadcastFormInput = { titulo: '', contenido: '', destinatarios: 'TODOS', miembroIds: [] };
/** Personas elegidas que se muestran como chips antes de resumir en «+N». */
const VISIBLE_CHIPS = 4;

interface BroadcastSheetProps {
  visible: boolean;
  onClose: () => void;
}

type Errors = Partial<Record<keyof BroadcastFormInput, string>>;

interface AudienceOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}

/** Opción de destinatarios. Fondo, borde y radio en `style` de un View que se remonta (Android). */
const AudienceOption: React.FC<AudienceOptionProps> = ({ icon, title, subtitle, selected, onPress }) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={`${title}. ${subtitle}`}
    onPress={onPress}
    className="flex-1 active:opacity-80"
  >
    <View
      key={selected ? 'on' : 'off'}
      style={{
        borderCurve: 'continuous',
        borderRadius: 16,
        borderColor: selected ? ThemeColors.primary : ThemeColors.border,
        backgroundColor: selected ? ThemeColors.tertiary : ThemeColors.inputBg,
      }}
      className="min-h-16 flex-row items-center border-2 px-3 py-3"
    >
      <Ionicons name={icon} size={20} color={selected ? ThemeColors.primary : ThemeColors.mutedText} />
      <View className="flex-1 ml-2">
        <Text style={{ color: selected ? ThemeColors.primary : ThemeColors.neutral }} className="text-sm font-bold">
          {title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-neutral-muted">
          {subtitle}
        </Text>
      </View>
    </View>
  </Pressable>
);

/**
 * «Difundir aviso» (ADMIN y SUPERVISOR): título, mensaje y destinatarios (todo el equipo o los
 * miembros elegidos). Llega como notificación de tipo AVISO; muestra cómo se verá y a cuántos llegó.
 * Con el teclado abierto la hoja se levanta sobre él (`useKeyboardOverlap`, como en «Invitar»).
 */
export const BroadcastSheet: React.FC<BroadcastSheetProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization } = useActiveOrganization();
  const user = useUserDisplay();
  const broadcast = useBroadcastNotice();
  const team = useTaskMembers();
  const showCategory = useNotificationsStore((state) => state.showCategory);
  const [form, setForm] = useState<BroadcastFormInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState<'form' | 'recipients'>('form');
  const [sentTo, setSentTo] = useState<number | null>(null);

  const rootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [rootHeight, setRootHeight] = useState(0);
  const keyboardOverlap = useKeyboardOverlap(rootRef);
  const keyboardOpen = keyboardOverlap > 0;
  const messageY = useRef(0);
  const focusedField = useRef<'titulo' | 'contenido' | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(EMPTY_FORM);
      setErrors({});
      setStep('form');
      setSentTo(null);
      broadcast.reset();
    }
    // Solo al abrir: `broadcast` es un objeto nuevo en cada render.
  }, [visible]);

  // Cuando el teclado termina de abrirse (y la hoja se encoge), el mensaje queda a la vista.
  useEffect(() => {
    if (keyboardOpen && focusedField.current === 'contenido') {
      scrollRef.current?.scrollTo({ y: Math.max(0, messageY.current - 16), animated: true });
    }
  }, [keyboardOpen, keyboardOverlap]);

  const byId = useMemo(() => new Map((team.data ?? []).map((m) => [m.id, m])), [team.data]);
  const chosen = form.miembroIds.map((id) => byId.get(id)).filter((m) => !!m);
  const activeMembers = organization?.miembrosActivos ?? 0;
  const recipients = form.destinatarios === 'TODOS' ? activeMembers : form.miembroIds.length;
  const recipientsText = `${recipients} ${recipients === 1 ? 'miembro' : 'miembros'}`;

  const set = <K extends keyof BroadcastFormInput>(field: K, value: BroadcastFormInput[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const chooseAudience = (audience: BroadcastAudience) => {
    set('destinatarios', audience);
    if (audience === 'MIEMBROS' && form.miembroIds.length === 0) setStep('recipients');
  };

  const send = () => {
    const result = broadcastFormSchema.safeParse(form);
    if (!result.success) {
      const next: Errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof BroadcastFormInput;
        next[field] ??= issue.message;
      });
      setErrors(next);
      return;
    }
    broadcast.mutate(result.data, { onSuccess: (data) => setSentTo(data.notificacionesCreadas) });
  };

  const now = new Date().toISOString();
  const preview: AppNotification = {
    id: 'vista-previa',
    notificacionId: 'vista-previa',
    organizacionId: organization?.id ?? null,
    tipo: 'AVISO',
    titulo: form.titulo.trim() || 'Título del aviso',
    contenido: form.contenido.trim() || 'Aquí aparecerá tu mensaje.',
    referenciaId: null,
    actor: { id: 'yo', nombre: user.fullName },
    asistencia: null,
    leida: false,
    leidaEn: null,
    createdAt: now,
    updatedAt: now,
  };

  const header = (title: string, subtitle: string, onBack?: () => void) => (
    <View className="flex-row items-center px-5 pt-3 pb-4 border-b border-borderBg">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al aviso"
          onPress={onBack}
          className="w-11 h-11 -ml-2 mr-1 items-center justify-center active:opacity-70"
        >
          <Ionicons name="arrow-back" size={22} color={ThemeColors.neutral} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
          {title}
        </Text>
        <Text className="text-xs text-neutral-muted">{subtitle}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        disabled={broadcast.isPending}
        onPress={onClose}
        className="w-11 h-11 rounded-full bg-tertiary items-center justify-center active:opacity-70"
      >
        <Ionicons name="close" size={20} color={ThemeColors.neutral} />
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View
        ref={rootRef}
        onLayout={(event) => setRootHeight(event.nativeEvent.layout.height)}
        className="flex-1 justify-end"
      >
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={broadcast.isPending ? undefined : onClose}
          className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
        />

        <View
          accessibilityViewIsModal
          style={{
            borderCurve: 'continuous',
            // Con el teclado abierto la hoja queda sobre él y se encoge para no salirse de la pantalla.
            marginBottom: keyboardOverlap,
            paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 0) + 16,
            maxHeight: rootHeight > 0 ? rootHeight - keyboardOverlap - Math.max(insets.top, 0) - 16 : undefined,
          }}
          className="w-full max-w-[480px] self-center bg-cardBg rounded-t-3xl"
        >
          <View className="items-center pt-3">
            <View className="w-10 h-1 rounded-full bg-borderBg" />
          </View>

          {sentTo !== null ? (
            <View className="items-center px-6 pt-6 pb-2">
              <View
                style={{ backgroundColor: ThemeStatus.successBg }}
                className="w-16 h-16 rounded-full items-center justify-center"
              >
                <Ionicons name="checkmark" size={32} color={ThemeStatus.success} />
              </View>
              <Text accessibilityRole="header" className="mt-4 text-xl font-extrabold text-neutral text-center">
                Aviso enviado
              </Text>
              <Text accessibilityLiveRegion="polite" className="mt-2 text-sm text-neutral-muted text-center">
                «{form.titulo.trim()}» llegó como notificación a {sentTo} {sentTo === 1 ? 'miembro' : 'miembros'}.
              </Text>
              <View className="w-full gap-3 mt-6">
                <AppButton
                  title="Ver en notificaciones"
                  icon="notifications-outline"
                  onPress={() => {
                    showCategory('AVISOS');
                    onClose();
                    router.push('/notificaciones');
                  }}
                />
                <AppButton title="Listo" variant="secondary" onPress={onClose} />
              </View>
            </View>
          ) : step === 'recipients' ? (
            <>
              {header('Elegir destinatarios', 'Solo ellos recibirán el aviso', () => setStep('form'))}
              <ScrollView
                style={{ flexGrow: 0, flexShrink: 1 }}
                contentContainerClassName="px-5 pt-4 pb-2"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <BroadcastRecipients
                  members={team.data}
                  isLoading={team.isPending}
                  value={form.miembroIds}
                  onChange={(ids) => set('miembroIds', ids)}
                />
              </ScrollView>
              <View className="px-5 pt-4 mt-2 border-t border-borderBg">
                <AppButton
                  title={`Listo (${form.miembroIds.length})`}
                  onPress={() => {
                    if (form.miembroIds.length === 0) set('destinatarios', 'TODOS');
                    setStep('form');
                  }}
                />
              </View>
            </>
          ) : (
            <>
              {header(
                'Difundir aviso',
                `Llegará a ${recipientsText} de ${organization?.nombre ?? 'tu organización'}`,
              )}

              <ScrollView
                ref={scrollRef}
                style={{ flexGrow: 0, flexShrink: 1 }}
                contentContainerClassName="px-5 pt-4 pb-2"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <AppInput
                  label="Título"
                  requiredText="Obligatorio"
                  leftIcon="megaphone-outline"
                  placeholder="Ej.: Reunión general el viernes"
                  value={form.titulo}
                  onChangeText={(text) => set('titulo', text)}
                  onFocus={() => (focusedField.current = 'titulo')}
                  error={errors.titulo}
                  maxLength={120}
                />

                <View onLayout={(event) => (messageY.current = event.nativeEvent.layout.y)}>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs font-semibold text-neutral">Mensaje</Text>
                    <Text className="text-[11px] text-neutral-muted">
                      {form.contenido.length}/{MESSAGE_MAX}
                    </Text>
                  </View>
                  <TextInput
                    accessibilityLabel="Mensaje del aviso"
                    multiline
                    textAlignVertical="top"
                    style={{ fontFamily: 'DMSans_400Regular', minHeight: 112 }}
                    className={`bg-inputBg border rounded-2xl p-4 text-sm leading-6 text-neutral ${
                      errors.contenido ? 'border-red-500' : 'border-borderBg'
                    }`}
                    placeholder="Escribe lo que el equipo debe saber…"
                    placeholderTextColor={ThemeColors.mutedText}
                    value={form.contenido}
                    maxLength={MESSAGE_MAX}
                    onChangeText={(text) => set('contenido', text)}
                    onFocus={() => {
                      focusedField.current = 'contenido';
                      // Si el teclado ya estaba abierto (venía del título), se desplaza ahora.
                      if (keyboardOpen) {
                        scrollRef.current?.scrollTo({ y: Math.max(0, messageY.current - 16), animated: true });
                      }
                    }}
                    onBlur={() => (focusedField.current = null)}
                  />
                  {errors.contenido ? (
                    <Text className="mt-1.5 ml-1 text-xs font-medium text-red-600">{errors.contenido}</Text>
                  ) : null}
                </View>

                <Text className="mt-5 mb-2 text-xs font-bold tracking-wider text-primary">DESTINATARIOS</Text>
                <View accessibilityRole="radiogroup" className="flex-row gap-2">
                  <AudienceOption
                    icon="people-outline"
                    title="Todo el equipo"
                    subtitle={`${activeMembers} ${activeMembers === 1 ? 'miembro activo' : 'miembros activos'}`}
                    selected={form.destinatarios === 'TODOS'}
                    onPress={() => chooseAudience('TODOS')}
                  />
                  <AudienceOption
                    icon="person-add-outline"
                    title="Elegir miembros"
                    subtitle={
                      form.miembroIds.length > 0
                        ? `${form.miembroIds.length} ${form.miembroIds.length === 1 ? 'elegido' : 'elegidos'}`
                        : 'Personas concretas'
                    }
                    selected={form.destinatarios === 'MIEMBROS'}
                    onPress={() => chooseAudience('MIEMBROS')}
                  />
                </View>

                {form.destinatarios === 'MIEMBROS' ? (
                  <View className="mt-3 flex-row flex-wrap items-center gap-2">
                    {chosen.slice(0, VISIBLE_CHIPS).map((member) => (
                      <Pressable
                        key={member.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar a ${member.nombre}`}
                        onPress={() => set('miembroIds', form.miembroIds.filter((id) => id !== member.id))}
                        className="min-h-11 flex-row items-center bg-inputBg border border-borderBg rounded-full pl-1 pr-3 active:opacity-70"
                      >
                        <UserAvatar size={28} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
                        <Text className="ml-2 text-sm font-semibold text-neutral">{member.nombre.split(' ')[0]}</Text>
                        <Ionicons name="close" size={14} color={ThemeColors.mutedText} style={{ marginLeft: 6 }} />
                      </Pressable>
                    ))}
                    {chosen.length > VISIBLE_CHIPS ? (
                      <Text className="text-sm font-bold text-neutral-muted">+{chosen.length - VISIBLE_CHIPS}</Text>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Elegir destinatarios"
                      onPress={() => setStep('recipients')}
                      className="min-h-11 flex-row items-center rounded-full border border-dashed border-primary/50 px-3 active:opacity-70"
                    >
                      <Ionicons name={chosen.length > 0 ? 'create-outline' : 'add'} size={16} color={ThemeColors.primary} />
                      <Text className="ml-1 text-sm font-bold text-primary">{chosen.length > 0 ? 'Editar' : 'Elegir'}</Text>
                    </Pressable>
                  </View>
                ) : null}
                {errors.miembroIds ? (
                  <Text className="mt-1.5 ml-1 text-xs font-medium text-red-600">{errors.miembroIds}</Text>
                ) : null}

                <Text className="mt-5 mb-2 text-xs font-bold tracking-wider text-primary">VISTA PREVIA</Text>
                <View
                  pointerEvents="none"
                  accessible
                  accessibilityLabel={`Vista previa: ${preview.titulo}. ${preview.contenido}`}
                  style={{ borderCurve: 'continuous', borderRadius: 28 }}
                  className="bg-screenBg p-1"
                >
                  <NotificationCard notification={preview} now={Date.now()} onPress={() => {}} onAction={() => {}} />
                </View>

                {broadcast.error ? (
                  <Text style={{ color: ThemeStatus.errorText }} className="mt-3 text-xs font-medium">
                    {broadcast.error.message}
                  </Text>
                ) : null}
              </ScrollView>

              <View className="flex-row gap-3 px-5 pt-4 mt-2 border-t border-borderBg">
                <View className="flex-1">
                  <AppButton title="Cancelar" variant="secondary" onPress={onClose} disabled={broadcast.isPending} />
                </View>
                <View style={{ flex: 1.6 }}>
                  <AppButton
                    title={`Enviar a ${recipientsText}`}
                    icon="paper-plane-outline"
                    onPress={send}
                    isLoading={broadcast.isPending}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

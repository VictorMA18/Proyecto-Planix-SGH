import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { UserAvatar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { commentFormSchema } from '@/schemas/task.schema';
import { useAddComment, useTaskComments } from '@/services/tasks';
import { getInitials } from '@/utils/format';
import { formatAgo } from '@/utils/tasks';

/** Conversación de la tarea: lista de comentarios y caja para escribir uno nuevo. */
export const CommentsPanel: React.FC<{ taskId: string; myMemberId: string | undefined }> = ({ taskId, myMemberId }) => {
  const comments = useTaskComments(taskId);
  const add = useAddComment();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const send = () => {
    const parsed = commentFormSchema.safeParse({ texto: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError('');
    add.mutate(
      { taskId, texto: parsed.data.texto },
      { onSuccess: () => setText(''), onError: (err) => setError(err.message) },
    );
  };

  return (
    <View className="gap-4">
      {comments.isPending ? (
        <ActivityIndicator color={ThemeColors.primary} />
      ) : comments.isError ? (
        <Text className="text-sm text-neutral-muted">No pudimos cargar los comentarios.</Text>
      ) : comments.data.length === 0 ? (
        <View className="items-center py-6 gap-2">
          <Ionicons name="chatbubbles-outline" size={32} color={ThemeColors.mutedText} />
          <Text className="text-sm text-neutral-muted text-center">Aún no hay comentarios. Sé el primero en escribir.</Text>
        </View>
      ) : (
        comments.data.map((comment) => {
          const mine = !!myMemberId && comment.autor.miembroId === myMemberId;
          return (
            <View
              key={comment.id}
              accessible
              accessibilityLabel={`${comment.autor.nombre}, ${formatAgo(comment.createdAt)}: ${comment.texto}`}
              className={`flex-row gap-3 ${mine ? 'flex-row-reverse' : ''}`}
            >
              <UserAvatar size={36} initials={getInitials(comment.autor.nombre)} uri={comment.autor.avatarUrl ?? undefined} />
              <View
                style={{
                  borderCurve: 'continuous',
                  backgroundColor: mine ? ThemeColors.tertiary : ThemeColors.cardBg,
                  borderTopRightRadius: mine ? 6 : 16,
                  borderTopLeftRadius: mine ? 16 : 6,
                }}
                className="flex-1 rounded-2xl p-3"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text numberOfLines={1} className="flex-1 text-sm font-extrabold text-neutral">
                    {mine ? 'Tú' : comment.autor.nombre}
                  </Text>
                  <Text className="text-[11px] text-neutral-muted">{formatAgo(comment.createdAt)}</Text>
                </View>
                <Text className="mt-1 text-sm leading-5 text-neutral">{comment.texto}</Text>
              </View>
            </View>
          );
        })
      )}

      <View className="gap-1">
        <View
          style={{ borderCurve: 'continuous' }}
          className={`flex-row items-end bg-cardBg border rounded-2xl pl-4 pr-1 py-1 ${error ? 'border-red-500' : 'border-borderBg'}`}
        >
          <TextInput
            accessibilityLabel="Escribe un comentario"
            style={{ fontFamily: 'DMSans_400Regular', maxHeight: 120 }}
            className="flex-1 py-2.5 text-sm text-neutral"
            placeholder="Escribe un comentario…"
            placeholderTextColor={ThemeColors.mutedText}
            value={text}
            onChangeText={(value) => {
              setText(value);
              if (error) setError('');
            }}
            multiline
            maxLength={1000}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar comentario"
            accessibilityState={{ disabled: add.isPending || !text.trim() }}
            disabled={add.isPending || !text.trim()}
            onPress={send}
            className={`w-11 h-11 rounded-xl items-center justify-center ${text.trim() ? 'bg-primary' : 'bg-tertiary'}`}
          >
            {add.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={18} color={text.trim() ? '#FFFFFF' : ThemeColors.mutedText} />
            )}
          </Pressable>
        </View>
        {error ? <Text className="ml-1 text-xs font-medium text-red-600">{error}</Text> : null}
      </View>
    </View>
  );
};

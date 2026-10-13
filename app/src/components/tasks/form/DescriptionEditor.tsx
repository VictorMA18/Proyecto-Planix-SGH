import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import {
  applyTextChange,
  attrsAt,
  docText,
  fromMarkdown,
  inBullet,
  removeLink,
  richFontFamily,
  setLink,
  toggleBullet,
  toggleMark,
  toMarkdown,
  toRuns,
  type RichAttrs,
  type RichDoc,
  type RichMark,
} from '@/utils/rich-text';

import { TaskSection } from '../detail/TaskSection';
import { DescriptionToolbar } from './DescriptionToolbar';
import { FieldError } from './FieldLabel';
import { LinkModal } from './LinkModal';

interface DescriptionEditorProps {
  /** Descripción en Markdown básico (lo que se guarda). */
  value: string;
  onChange: (markdown: string) => void;
  error?: string;
}

interface Selection {
  start: number;
  end: number;
}

const MAX_HISTORY = 50;
/** Lo escrito sin pausas de más de este tiempo se deshace de una vez. */
const TYPING_GROUP_MS = 1000;

/**
 * Descripción con estilo visible (negrita, cursiva, viñetas y enlaces) en lugar de Markdown: el
 * TextInput pinta el texto con `Text` anidados y se guarda como Markdown (`utils/rich-text.ts`).
 * La versión web (`DescriptionEditor.web.tsx`) usa un área editable del navegador.
 */
export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onChange, error }) => {
  const inputRef = useRef<TextInput>(null);
  const [doc, setDoc] = useState<RichDoc>(() => fromMarkdown(value));
  // La selección solo se lee: controlarla hace saltar el cursor en Android.
  const [selection, setSelection] = useState<Selection>(() => {
    const end = docText(fromMarkdown(value)).length;
    return { start: end, end };
  });
  /** Marcas elegidas en la barra sin selección: se aplican a lo próximo que se escriba. */
  const [typing, setTyping] = useState<RichAttrs | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [history, setHistory] = useState<{ doc: RichDoc; selection: Selection }[]>([]);
  const lastEmitted = useRef(value);
  const lastTypingAt = useRef(0);

  // Si el formulario cambia la descripción desde fuera (p. ej. al cargar la tarea), se vuelve a leer.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setDoc(fromMarkdown(value));
      setHistory([]);
    }
  }, [value]);

  const moveCursor = (next: Selection) => {
    setSelection(next);
    requestAnimationFrame(() => inputRef.current?.setSelection(next.start, next.end));
  };

  const commit = (next: RichDoc, cursor?: Selection) => {
    setDoc(next);
    const markdown = toMarkdown(next);
    lastEmitted.current = markdown;
    onChange(markdown);
    if (cursor) moveCursor(cursor);
  };

  const remember = () => setHistory((stack) => [...stack.slice(-(MAX_HISTORY - 1)), { doc, selection }]);

  const handleChangeText = (text: string) => {
    const now = Date.now();
    if (now - lastTypingAt.current > TYPING_GROUP_MS) remember();
    lastTypingAt.current = now;

    const change = applyTextChange(doc, text, typing);
    if (typing && text.length > docText(doc).length) setTyping(null);
    commit(change.doc, change.cursor === undefined ? undefined : { start: change.cursor, end: change.cursor });
  };

  // Las acciones de la barra son un paso de deshacer cada una.
  const format = (next: RichDoc, cursor?: Selection) => {
    remember();
    lastTypingAt.current = 0;
    commit(next, cursor);
  };

  const current = attrsAt(doc, selection.start, selection.end);
  const collapsed = selection.start === selection.end;

  const toggle = (mark: RichMark) => {
    if (collapsed) {
      const base = typing ?? { b: current.b, i: current.i };
      setTyping({ ...base, [mark]: !base[mark] });
      inputRef.current?.focus();
    } else {
      format(toggleMark(doc, selection.start, selection.end, mark));
    }
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((stack) => stack.slice(0, -1));
    setTyping(null);
    lastTypingAt.current = 0;
    commit(last.doc, last.selection);
  };

  const state = {
    bold: (typing ?? current).b,
    italic: (typing ?? current).i,
    list: inBullet(doc, selection.start),
    link: current.link,
    canUndo: history.length > 0,
  };

  return (
    <TaskSection icon="create-outline" title="Descripción">
      <DescriptionToolbar
        state={state}
        onBold={() => toggle('b')}
        onItalic={() => toggle('i')}
        onList={() => {
          const result = toggleBullet(doc, selection.start, selection.end);
          format(result.doc, { start: result.start, end: result.end });
        }}
        onLink={() => {
          if (current.link) format(removeLink(doc, selection.start, selection.end));
          else setLinkOpen(true);
        }}
        onUndo={undo}
      />
      <TextInput
        ref={inputRef}
        accessibilityLabel="Descripción de la tarea"
        multiline
        textAlignVertical="top"
        style={{ fontFamily: 'DMSans_400Regular', minHeight: 120 }}
        className={`bg-inputBg border rounded-2xl p-4 text-sm leading-6 text-neutral ${error ? 'border-red-500' : 'border-borderBg'}`}
        placeholder="Explica qué hay que hacer, con el detalle necesario…"
        placeholderTextColor={ThemeColors.mutedText}
        maxLength={2000}
        onSelectionChange={(event) => {
          const next = event.nativeEvent.selection;
          setSelection(next);
          if (next.start !== next.end) setTyping(null);
        }}
        onChangeText={handleChangeText}
      >
        {toRuns(doc).map((run, index) => (
          <Text
            key={index}
            style={{
              fontFamily: richFontFamily(run.b, run.i),
              color: run.href ? ThemeColors.primary : ThemeColors.neutral,
              textDecorationLine: run.href ? 'underline' : 'none',
            }}
          >
            {run.text}
          </Text>
        ))}
      </TextInput>
      <FieldError message={error} />

      <LinkModal
        visible={linkOpen}
        askLabel={collapsed}
        onCancel={() => setLinkOpen(false)}
        onConfirm={({ url, label }) => {
          setLinkOpen(false);
          const change = setLink(doc, selection.start, selection.end, url, label);
          format(change.doc, change.cursor === undefined ? undefined : { start: change.cursor, end: change.cursor });
        }}
      />
    </TaskSection>
  );
};

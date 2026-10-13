import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { BULLET, docText, fromMarkdown, toMarkdown, toRuns, type RichDoc } from '@/utils/rich-text';

import { TaskSection } from '../detail/TaskSection';
import { DescriptionToolbar, type DescriptionToolbarState } from './DescriptionToolbar';
import { FieldError } from './FieldLabel';
import { LinkModal } from './LinkModal';

interface DescriptionEditorProps {
  /** Descripción en Markdown básico (lo que se guarda). */
  value: string;
  onChange: (markdown: string) => void;
  error?: string;
}

// En la web, TextInput es un <textarea> sin estilos por tramo: se usa un área editable del navegador
// con sus comandos (negrita, cursiva, lista, enlace y deshacer) y se convierte a Markdown al escribir.

const CLASS = 'planix-description';
const CSS = `
.${CLASS} b, .${CLASS} strong { font-family: DMSans_700Bold, sans-serif; font-weight: 700; }
.${CLASS} i, .${CLASS} em { font-family: DMSans_400Regular_Italic, sans-serif; font-style: italic; }
.${CLASS} b i, .${CLASS} i b, .${CLASS} strong em, .${CLASS} em strong { font-family: DMSans_700Bold_Italic, sans-serif; }
.${CLASS} a { color: ${ThemeColors.primary}; text-decoration: underline; }
.${CLASS} ul { margin: 0; padding-left: 20px; }
`;

const NEWLINE = { ch: '\n', b: false, i: false, href: null };

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function lineHtml(line: RichDoc): string {
  return toRuns(line)
    .map((run) => {
      let html = escapeHtml(run.text);
      if (run.i) html = `<i>${html}</i>`;
      if (run.b) html = `<b>${html}</b>`;
      if (run.href) html = `<a href="${escapeHtml(run.href)}">${html}</a>`;
      return html;
    })
    .join('');
}

function toHtml(doc: RichDoc): string {
  if (doc.length === 0) return '';
  const lines: RichDoc[] = [[]];
  for (const c of doc) {
    if (c.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(c);
  }
  let html = '';
  let inList = false;
  for (const line of lines) {
    const bullet = docText(line.slice(0, BULLET.length)) === BULLET;
    if (bullet && !inList) html += '<ul>';
    if (!bullet && inList) html += '</ul>';
    inList = bullet;
    const content = lineHtml(bullet ? line.slice(BULLET.length) : line) || '<br>';
    html += bullet ? `<li>${content}</li>` : `<div>${content}</div>`;
  }
  return inList ? `${html}</ul>` : html;
}

/** Lee el área editable: cada bloque (div, p, li) es una línea y los <li> llevan viñeta. */
function fromDom(root: HTMLElement): RichDoc {
  const out: RichDoc = [];
  const newline = () => {
    if (out.length > 0 && out[out.length - 1].ch !== '\n') out.push({ ...NEWLINE });
  };
  const walk = (node: Node, attrs: { b: boolean; i: boolean; href: string | null }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const ch of (node.textContent ?? '').replace(/ /g, ' ').split('')) out.push({ ch, ...attrs });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName;
    if (tag === 'BR') {
      // El <br> que cierra un bloque solo le da altura a una línea vacía.
      const parent = node.parentElement;
      const closesBlock = !node.nextSibling && parent && parent !== root && /^(DIV|P|LI)$/.test(parent.tagName);
      if (!closesBlock) out.push({ ...NEWLINE });
      return;
    }
    const weight = node.style.fontWeight;
    const next = {
      b: attrs.b || tag === 'B' || tag === 'STRONG' || weight === 'bold' || Number(weight) >= 600,
      i: attrs.i || tag === 'I' || tag === 'EM' || node.style.fontStyle === 'italic',
      href: tag === 'A' ? node.getAttribute('href') : attrs.href,
    };
    const block = /^(DIV|P|LI|UL|OL|H[1-6])$/.test(tag);
    if (block) newline();
    const before = out.length;
    if (tag === 'LI') for (const ch of BULLET.split('')) out.push({ ch, b: false, i: false, href: null });
    node.childNodes.forEach((child) => walk(child, next));
    if (block && out.length === before) out.push({ ...NEWLINE }); // línea vacía
    if (block) newline();
  };
  root.childNodes.forEach((child) => walk(child, { b: false, i: false, href: null }));
  if (out[out.length - 1]?.ch === '\n') out.pop();
  return out;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onChange, error }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastEmitted = useRef(value);
  const [empty, setEmpty] = useState(value.trim() === '');
  const [focused, setFocused] = useState(false);
  const [edits, setEdits] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkAskLabel, setLinkAskLabel] = useState(true);
  const [state, setState] = useState<Omit<DescriptionToolbarState, 'canUndo'>>({
    bold: false,
    italic: false,
    list: false,
    link: false,
  });

  // Contenido inicial y cambios desde fuera (p. ej. al cargar la tarea en el formulario).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML === '' || value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.innerHTML = toHtml(fromMarkdown(value));
      setEmpty(value.trim() === '');
    }
  }, [value]);

  const currentLink = () => {
    const node = savedRange.current?.startContainer;
    const element = node instanceof HTMLElement ? node : node?.parentElement;
    const anchor = element?.closest('a');
    return anchor && editorRef.current?.contains(anchor) ? anchor : null;
  };

  const refresh = useCallback(() => {
    setState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      list: document.queryCommandState('insertUnorderedList'),
      link: !!currentLink(),
    });
  }, []);

  // Guarda la selección del área editable: al tocar la barra el navegador la pierde.
  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
      savedRange.current = selection.getRangeAt(0).cloneRange();
      refresh();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [refresh]);

  const emit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const doc = fromDom(editor);
    const markdown = toMarkdown(doc);
    lastEmitted.current = markdown;
    setEmpty(docText(doc).trim() === '');
    onChange(markdown);
  };

  const restore = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
  };

  const run = (command: string, arg?: string) => {
    restore();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command, false, arg);
    setEdits((count) => count + 1);
    emit();
    refresh();
  };

  const undo = () => {
    restore();
    document.execCommand('undo');
    setEdits((count) => Math.max(0, count - 1));
    emit();
    refresh();
  };

  const toggleLink = () => {
    const anchor = currentLink();
    if (anchor) {
      // Quita el enlace completo aunque solo se haya tocado una parte.
      const range = document.createRange();
      range.selectNodeContents(anchor);
      savedRange.current = range;
      run('unlink');
      return;
    }
    setLinkAskLabel(!savedRange.current || savedRange.current.collapsed);
    setLinkOpen(true);
  };

  return (
    <TaskSection icon="create-outline" title="Descripción">
      <style>{CSS}</style>
      <DescriptionToolbar
        state={{ ...state, canUndo: edits > 0 }}
        onBold={() => run('bold')}
        onItalic={() => run('italic')}
        onList={() => run('insertUnorderedList')}
        onLink={toggleLink}
        onUndo={undo}
      />
      <View>
        <div
          ref={editorRef}
          className={CLASS}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          aria-label="Descripción de la tarea"
          onInput={() => {
            setEdits((count) => count + 1);
            emit();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPaste={(event) => {
            // Solo texto: sin estilos ni elementos de otras páginas.
            event.preventDefault();
            document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
          }}
          style={{
            minHeight: 120,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: error ? '#EF4444' : focused ? ThemeColors.primary : ThemeColors.border,
            backgroundColor: ThemeColors.inputBg,
            color: ThemeColors.neutral,
            fontFamily: 'DMSans_400Regular, sans-serif',
            fontSize: 14,
            lineHeight: '24px',
            outline: 'none',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        />
        {empty ? (
          <Text
            pointerEvents="none"
            style={{ position: 'absolute', top: 16, left: 17, right: 16, lineHeight: 24 }}
            className="text-sm text-neutral-muted"
          >
            Explica qué hay que hacer, con el detalle necesario…
          </Text>
        ) : null}
      </View>
      <FieldError message={error} />

      <LinkModal
        visible={linkOpen}
        askLabel={linkAskLabel}
        onCancel={() => setLinkOpen(false)}
        onConfirm={({ url, label }) => {
          setLinkOpen(false);
          if (linkAskLabel) {
            run('insertHTML', `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>&nbsp;`);
          } else {
            run('createLink', url);
          }
        }}
      />
    </TaskSection>
  );
};

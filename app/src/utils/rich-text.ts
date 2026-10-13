// Modelo del editor de la descripción de una tarea. El usuario ve el texto ya con estilo (negrita,
// cursiva, enlaces y viñetas), pero se guarda como el mismo Markdown básico que muestra
// `MarkdownText`: **negrita**, _cursiva_, [texto](https://…) y listas con «- ».
//
// El documento es un carácter (unidad UTF-16, como las posiciones de selección de TextInput) por
// entrada con sus marcas. Las viñetas son el texto «• » al inicio de la línea.

export interface RichChar {
  ch: string;
  b: boolean;
  i: boolean;
  href: string | null;
}
export type RichDoc = RichChar[];
export type RichMark = 'b' | 'i';
export interface RichAttrs {
  b: boolean;
  i: boolean;
}
export interface RichRun {
  text: string;
  b: boolean;
  i: boolean;
  href: string | null;
}

export const BULLET = '• ';
const INLINE = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/;

const NONE: RichAttrs = { b: false, i: false };

function push(out: RichDoc, text: string, attrs: RichAttrs, href: string | null = null) {
  for (const ch of text.split('')) out.push({ ch, b: attrs.b, i: attrs.i, href });
}

export const docText = (doc: RichDoc) => doc.map((c) => c.ch).join('');

// ---------------------------------------------------------------------------------------------
// Markdown ⇄ documento

function parseInline(text: string, attrs: RichAttrs, href: string | null, out: RichDoc) {
  for (const part of text.split(INLINE)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      parseInline(part.slice(2, -2), { ...attrs, b: true }, href, out);
    } else if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
      parseInline(part.slice(1, -1), { ...attrs, i: true }, href, out);
    } else {
      const link = LINK.exec(part);
      if (link) parseInline(link[1], attrs, link[2], out);
      else push(out, part, attrs, href);
    }
  }
}

export function fromMarkdown(markdown: string): RichDoc {
  const out: RichDoc = [];
  markdown.split('\n').forEach((line, index) => {
    if (index > 0) push(out, '\n', NONE);
    const bullet = /^\s*[-*] /.exec(line);
    if (bullet) push(out, BULLET, NONE);
    parseInline(bullet ? line.slice(bullet[0].length) : line, NONE, null, out);
  });
  return out;
}

/** Tramos consecutivos con las mismas marcas. */
export function toRuns(doc: RichDoc): RichRun[] {
  const runs: RichRun[] = [];
  for (const c of doc) {
    const last = runs[runs.length - 1];
    if (last && last.b === c.b && last.i === c.i && last.href === c.href) last.text += c.ch;
    else runs.push({ text: c.ch, b: c.b, i: c.i, href: c.href });
  }
  return runs;
}

function wrap(text: string, b: boolean, i: boolean): string {
  // Los espacios quedan fuera de las marcas para que el Markdown siga siendo válido.
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!;
  if (!match[2]) return text;
  let inner = match[2];
  if (i) inner = `_${inner}_`;
  if (b) inner = `**${inner}**`;
  return match[1] + inner + match[3];
}

export function toMarkdown(doc: RichDoc): string {
  const lines: RichDoc[] = [[]];
  for (const c of doc) {
    if (c.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(c);
  }
  return lines
    .map((line) => {
      const bullet = docText(line.slice(0, BULLET.length)) === BULLET;
      const body = toRuns(bullet ? line.slice(BULLET.length) : line)
        .map((run) =>
          run.href && run.text.trim() ? `[${run.text.trim()}](${run.href})` : wrap(run.text, run.b, run.i),
        )
        .join('');
      return bullet ? `- ${body}` : body;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------------------------
// Edición

/** Marcas que se ven en la barra para la selección actual. */
export function attrsAt(doc: RichDoc, start: number, end: number): RichAttrs & { link: boolean } {
  const range = doc.slice(start, end).filter((c) => c.ch !== '\n');
  if (range.length > 0) {
    return { b: range.every((c) => c.b), i: range.every((c) => c.i), link: range.some((c) => !!c.href) };
  }
  const prev = doc[start - 1];
  return { b: !!prev?.b, i: !!prev?.i, link: !!prev?.href && doc[start]?.href === prev.href };
}

function lineStartOf(doc: RichDoc, index: number): number {
  let i = Math.min(index, doc.length);
  while (i > 0 && doc[i - 1].ch !== '\n') i--;
  return i;
}

const hasBullet = (doc: RichDoc, lineStart: number) => docText(doc.slice(lineStart, lineStart + BULLET.length)) === BULLET;

/** Si la línea del cursor empieza con viñeta. */
export const inBullet = (doc: RichDoc, index: number) => hasBullet(doc, lineStartOf(doc, index));

export interface RichChange {
  doc: RichDoc;
  /** Cursor tras el cambio, cuando el editor debe moverlo (p. ej. al continuar una viñeta). */
  cursor?: number;
}

/**
 * Aplica el texto nuevo del TextInput: lo que cambió se detecta por el prefijo y el sufijo comunes.
 * Lo escrito toma las marcas de `typing` (elegidas en la barra sin selección) o las del carácter
 * anterior; un enlace solo se extiende si se escribe dentro de él.
 */
export function applyTextChange(doc: RichDoc, next: string, typing: RichAttrs | null): RichChange {
  const old = docText(doc);
  let p = 0;
  while (p < old.length && p < next.length && old[p] === next[p]) p++;
  let s = 0;
  while (s < old.length - p && s < next.length - p && old[old.length - 1 - s] === next[next.length - 1 - s]) s++;

  const inserted = next.slice(p, next.length - s);
  const prev = doc[p - 1];
  const after = doc[old.length - s];
  const attrs = typing ?? { b: !!prev?.b, i: !!prev?.i };
  const href = prev?.href && after?.href === prev.href ? prev.href : null;

  const added: RichDoc = [];
  for (const ch of inserted.split('')) {
    added.push(ch === '\n' ? { ch, b: false, i: false, href: null } : { ch, b: attrs.b, i: attrs.i, href });
  }
  let result = [...doc.slice(0, p), ...added, ...doc.slice(old.length - s)];

  // Enter en una viñeta: continúa la lista, o la termina si la viñeta estaba vacía.
  if (inserted === '\n') {
    const start = lineStartOf(result, p);
    if (hasBullet(result, start)) {
      if (p - start === BULLET.length) {
        result = [...result.slice(0, start), ...result.slice(p + 1)];
        return { doc: result, cursor: start };
      }
      const bullet: RichDoc = [];
      push(bullet, BULLET, NONE);
      result = [...result.slice(0, p + 1), ...bullet, ...result.slice(p + 1)];
      return { doc: result, cursor: p + 1 + BULLET.length };
    }
  }
  return { doc: result };
}

/** Pone o quita negrita o cursiva en la selección (si toda la tenía, se quita). */
export function toggleMark(doc: RichDoc, start: number, end: number, mark: RichMark): RichDoc {
  const all = doc.slice(start, end).every((c) => c.ch === '\n' || c[mark]);
  return doc.map((c, index) => (index >= start && index < end && c.ch !== '\n' ? { ...c, [mark]: !all } : c));
}

/** Pone o quita la viñeta de las líneas de la selección. Devuelve también la selección movida. */
export function toggleBullet(
  doc: RichDoc,
  start: number,
  end: number,
): { doc: RichDoc; start: number; end: number } {
  const starts: number[] = [];
  for (let i = lineStartOf(doc, start); ; ) {
    starts.push(i);
    const next = nextLine(doc, i);
    // Una selección que termina justo al inicio de una línea no la incluye.
    if (next > doc.length || next > Math.max(start, end - 1)) break;
    i = next;
  }
  const remove = starts.every((lineStart) => hasBullet(doc, lineStart));
  let result = doc;
  let shiftStart = 0;
  let shiftEnd = 0;
  // De atrás hacia adelante para que las posiciones anteriores no cambien.
  for (const lineStart of [...starts].reverse()) {
    if (remove) {
      result = [...result.slice(0, lineStart), ...result.slice(lineStart + BULLET.length)];
      if (lineStart < start) shiftStart -= BULLET.length;
      if (lineStart <= end) shiftEnd -= BULLET.length;
    } else if (!hasBullet(result, lineStart)) {
      const bullet: RichDoc = [];
      push(bullet, BULLET, NONE);
      result = [...result.slice(0, lineStart), ...bullet, ...result.slice(lineStart)];
      if (lineStart <= start) shiftStart += BULLET.length;
      if (lineStart <= end) shiftEnd += BULLET.length;
    }
  }
  return { doc: result, start: Math.max(0, start + shiftStart), end: Math.max(0, end + shiftEnd) };
}

function nextLine(doc: RichDoc, lineStart: number): number {
  let i = lineStart;
  while (i < doc.length && doc[i].ch !== '\n') i++;
  return i + 1;
}

/** Enlaza la selección o, sin selección, inserta `label` enlazado en el cursor. */
export function setLink(doc: RichDoc, start: number, end: number, href: string, label: string): RichChange {
  if (start === end) {
    const added: RichDoc = [];
    push(added, label, NONE, href);
    return { doc: [...doc.slice(0, start), ...added, ...doc.slice(start)], cursor: start + added.length };
  }
  return { doc: doc.map((c, index) => (index >= start && index < end && c.ch !== '\n' ? { ...c, href } : c)) };
}

/** Quita el enlace que toca la selección (o el cursor), completo. */
export function removeLink(doc: RichDoc, start: number, end: number): RichDoc {
  const hrefs = new Set(
    doc
      .slice(Math.max(0, start - (start === end ? 1 : 0)), Math.max(end, start + (start === end ? 1 : 0)))
      .map((c) => c.href)
      .filter(Boolean),
  );
  return doc.map((c) => (c.href && hrefs.has(c.href) ? { ...c, href: null } : c));
}

/** Fuente de DM Sans para cada combinación de negrita y cursiva. */
export function richFontFamily(b: boolean, i: boolean): string {
  if (b && i) return 'DMSans_700Bold_Italic';
  if (b) return 'DMSans_700Bold';
  if (i) return 'DMSans_400Regular_Italic';
  return 'DMSans_400Regular';
}

import React from 'react';
import { Linking, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { richFontFamily } from '@/utils/rich-text';

// Markdown básico de las descripciones: **negrita**, _cursiva_ (combinables), [enlaces](https://…) y
// listas con «- ». Es lo que guarda el editor de la descripción (`utils/rich-text.ts`).
const INLINE = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

interface Marks {
  b: boolean;
  i: boolean;
}

function Inline({ text, marks = { b: false, i: false } }: { text: string; marks?: Marks }) {
  return (
    <>
      {text.split(INLINE).map((part, i) => {
        if (!part) return null;
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
          return <Inline key={i} text={part.slice(2, -2)} marks={{ ...marks, b: true }} />;
        }
        if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
          return <Inline key={i} text={part.slice(1, -1)} marks={{ ...marks, i: true }} />;
        }
        const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
        if (link) {
          return (
            <Text
              key={i}
              accessibilityRole="link"
              onPress={() => Linking.openURL(link[2])}
              style={{ fontFamily: richFontFamily(marks.b, marks.i), color: ThemeColors.primary }}
              className="underline"
            >
              {link[1]}
            </Text>
          );
        }
        if (!marks.b && !marks.i) return part;
        return (
          <Text key={i} style={{ fontFamily: richFontFamily(marks.b, marks.i), color: marks.b ? ThemeColors.neutral : undefined }}>
            {part}
          </Text>
        );
      })}
    </>
  );
}

/** Muestra una descripción escrita con Markdown básico. */
export const MarkdownText: React.FC<{ text: string }> = ({ text }) => (
  <View className="gap-2">
    {text.split(/\n{2,}/).map((block, b) => {
      const lines = block.split('\n');
      if (lines.every((line) => /^\s*[-*] /.test(line))) {
        return (
          <View key={b} className="gap-1">
            {lines.map((line, l) => (
              <View key={l} className="flex-row">
                <Text className="text-sm leading-6 text-neutral-muted mr-2">•</Text>
                <Text className="flex-1 text-sm leading-6 text-neutral-muted">
                  <Inline text={line.replace(/^\s*[-*] /, '')} />
                </Text>
              </View>
            ))}
          </View>
        );
      }
      return (
        <Text key={b} className="text-sm leading-6 text-neutral-muted">
          <Inline text={lines.join('\n')} />
        </Text>
      );
    })}
  </View>
);

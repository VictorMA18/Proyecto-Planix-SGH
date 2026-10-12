import React from 'react';
import { Linking, Text, View } from 'react-native';

// Markdown básico de las descripciones: **negrita**, _cursiva_, [enlaces](https://…) y listas con «- ».
const INLINE = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} className="font-bold text-neutral">
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return (
            <Text key={i} className="italic">
              {part.slice(1, -1)}
            </Text>
          );
        }
        const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
        if (link) {
          return (
            <Text
              key={i}
              accessibilityRole="link"
              onPress={() => Linking.openURL(link[2])}
              className="font-semibold text-primary underline"
            >
              {link[1]}
            </Text>
          );
        }
        return part;
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

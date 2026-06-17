import React from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import { useAppSelector } from '../store';

interface MarkdownRendererProps {
  content: string;
  isDark: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isDark }) => {
  const textColor = isDark ? '#F8FAFC' : '#1E293B';
  const codeBg = isDark ? '#1E293B' : '#F1F5F9';
  const codeTextColor = isDark ? '#FDA4AF' : '#BE123C';
  const blockBg = isDark ? '#151C2C' : '#F8FAFC';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  const markdownStyles = StyleSheet.create({
    body: {
      color: textColor,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'System',
    },
    heading1: {
      color: textColor,
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 6,
    },
    heading2: {
      color: textColor,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 10,
      marginBottom: 4,
    },
    heading3: {
      color: textColor,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 4,
    },
    hr: {
      backgroundColor: borderColor,
      height: 1,
      marginVertical: 10,
    },
    bullet_list: {
      marginVertical: 6,
    },
    ordered_list: {
      marginVertical: 6,
    },
    list_item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginVertical: 3,
    },
    bullet_list_icon: {
      color: isDark ? '#6366F1' : '#4F46E5',
      fontSize: 16,
      marginRight: 6,
    },
    ordered_list_icon: {
      color: isDark ? '#6366F1' : '#4F46E5',
      fontWeight: 'bold',
      fontSize: 14,
      marginRight: 6,
    },
    code_inline: {
      backgroundColor: codeBg,
      color: codeTextColor,
      fontFamily: 'monospace',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 13,
    },
    code_block: {
      backgroundColor: codeBg,
      color: isDark ? '#E2E8F0' : '#0F172A',
      fontFamily: 'monospace',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
      marginVertical: 8,
      fontSize: 13,
    },
    fence: {
      backgroundColor: codeBg,
      color: isDark ? '#E2E8F0' : '#0F172A',
      fontFamily: 'monospace',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
      marginVertical: 8,
      fontSize: 13,
    },
    blockquote: {
      backgroundColor: blockBg,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#6366F1' : '#4F46E5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginVertical: 6,
      borderRadius: 4,
    },
    link: {
      color: isDark ? '#818CF8' : '#4F46E5',
      textDecorationLine: 'underline',
    },
  });

  return (
    <View className="flex-1">
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </View>
  );
};

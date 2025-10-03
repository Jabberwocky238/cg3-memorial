import { useState } from 'react';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote'; 
import { Heading } from 'reactjs-tiptap-editor/heading';
import { Bold } from 'reactjs-tiptap-editor/bold'; 
import { BulletList } from 'reactjs-tiptap-editor/bulletlist'; 
import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit } from 'reactjs-tiptap-editor';
import { Code } from 'reactjs-tiptap-editor/code'; 
import { CodeBlock } from 'reactjs-tiptap-editor/codeblock'; 
import 'prism-code-editor-lightweight/layout.css'; 
import 'prism-code-editor-lightweight/themes/github-dark.css';
import 'reactjs-tiptap-editor/style.css';
import { Color } from 'reactjs-tiptap-editor/color'; 
import { Document } from 'reactjs-tiptap-editor/document'; 
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize'; 
import { FormatPainter } from 'reactjs-tiptap-editor/formatpainter'; 
import { History } from 'reactjs-tiptap-editor/history'; 
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule'; 
import { Image } from 'reactjs-tiptap-editor/image'; 
import 'react-image-crop/dist/ReactCrop.css'; 
import { Indent } from 'reactjs-tiptap-editor/indent'; 

const extensions = [
  BaseKit.configure({
    // Show placeholder
    placeholder: {
      showOnlyCurrent: true,
    },

    // Character count
    characterCount: {
      limit: 50_000,
    },
  }), 
  Heading,
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Color,
  Document,
  FontFamily,
  FontSize,
  FormatPainter,
  History,
  HorizontalRule,
  Image.configure({
    upload: (file: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(file))
        }, 500)
      })
    },
  }),
  Indent,
];

const DEFAULT = '';

export default function TipTap() {
  const [content, setContent] = useState(DEFAULT);

  const onChangeContent = (value: any) => {
    setContent(value);
  };

  return (
    <RichTextEditor
      output='html'
      content={content}
      onChangeContent={onChangeContent}
      extensions={extensions}
    />
  );
};
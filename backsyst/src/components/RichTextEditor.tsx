"use client";

import React, { useRef, useEffect } from 'react';
import {
  Video,
  Image as ImageIcon,
  Music,
  Link2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
  onOpenVideoModal?: () => void;
  onOpenImageModal?: () => void;
  onOpenAudioModal?: () => void;
  onOpenLinkModal?: () => void;
}

export function RichTextEditor({
  content,
  onChange,
  disabled = false,
  onOpenVideoModal,
  onOpenImageModal,
  onOpenAudioModal,
  onOpenLinkModal,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Get pasted data
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    // If HTML is available (from Word/Google Docs), use it
    if (htmlData) {
      // Clean up the HTML but preserve formatting
      const cleanHtml = cleanPastedHtml(htmlData);
      document.execCommand('insertHTML', false, cleanHtml);
    } else {
      // Fallback to plain text
      document.execCommand('insertText', false, textData);
    }
    
    handleInput();
  };

  const cleanPastedHtml = (html: string): string => {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove style tags (Word CSS definitions)
    const styleTags = temp.querySelectorAll('style');
    styleTags.forEach(tag => tag.remove());

    // Remove script tags
    const scriptTags = temp.querySelectorAll('script');
    scriptTags.forEach(tag => tag.remove());

    // Remove comments (Word metadata)
    const removeComments = (node: Node) => {
      const iterator = document.createNodeIterator(node, NodeFilter.SHOW_COMMENT);
      const commentsToRemove: Node[] = [];
      let currentNode;
      while (currentNode = iterator.nextNode()) {
        commentsToRemove.push(currentNode);
      }
      commentsToRemove.forEach(comment => comment.parentNode?.removeChild(comment));
    };
    removeComments(temp);

    // Remove Word-specific tags
    const wordTags = temp.querySelectorAll('o\\:p, w\\:sdt, w\\:sdtPr, w\\:sdtContent');
    wordTags.forEach(tag => tag.remove());

    // Allowed tags and attributes
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption'];
    const allowedAttributes = ['href', 'target', 'rel', 'style', 'colspan', 'rowspan'];
    
    // Allowed CSS properties for inline styles
    const allowedStyles = [
      'text-align',
      'text-indent', 
      'margin',
      'margin-top',
      'margin-bottom',
      'margin-left',
      'margin-right',
      'padding',
      'padding-top',
      'padding-bottom',
      'padding-left',
      'padding-right',
      'line-height',
      'color',
      'background-color',
      'font-weight',
      'font-style',
      'text-decoration',
      'border',
      'border-top',
      'border-bottom',
      'border-left',
      'border-right',
      'border-color',
      'border-width',
      'border-style',
      'width',
      'height',
      'vertical-align'
    ];

    const cleanNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(true);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // Skip unwanted tags but keep their children
        if (!allowedTags.includes(tagName)) {
          const fragment = document.createDocumentFragment();
          Array.from(element.childNodes).forEach(child => {
            const cleaned = cleanNode(child);
            if (cleaned) fragment.appendChild(cleaned);
          });
          return fragment;
        }

        // Create clean element
        const cleanElement = document.createElement(tagName);

        // Copy only allowed attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name === 'style') {
            // Clean inline styles - only keep allowed CSS properties
            const styles = element.style;
            const cleanStyles: string[] = [];
            
            for (let i = 0; i < styles.length; i++) {
              const prop = styles[i];
              if (allowedStyles.includes(prop)) {
                const value = styles.getPropertyValue(prop);
                cleanStyles.push(`${prop}: ${value}`);
              }
            }
            
            if (cleanStyles.length > 0) {
              cleanElement.setAttribute('style', cleanStyles.join('; '));
            }
          } else if (allowedAttributes.includes(attr.name)) {
            cleanElement.setAttribute(attr.name, attr.value);
          }
        });

        // Clean children
        Array.from(element.childNodes).forEach(child => {
          const cleaned = cleanNode(child);
          if (cleaned) cleanElement.appendChild(cleaned);
        });

        return cleanElement;
      }

      return null;
    };

    const cleaned = cleanNode(temp);
    return cleaned ? (cleaned as HTMLElement).innerHTML || '' : '';
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    editorRef.current?.focus();
    handleInput();
  };

  const setAlignment = (align: string) => {
    const alignCommands: Record<string, string> = {
      'left': 'justifyLeft',
      'center': 'justifyCenter',
      'right': 'justifyRight',
      'justify': 'justifyFull',
    };
    
    document.execCommand(alignCommands[align], false);
    editorRef.current?.focus();
    handleInput();
  };

  const insertTable = () => {
    const rows = prompt('Jumlah baris:', '3');
    const cols = prompt('Jumlah kolom:', '2');
    
    if (!rows || !cols) return;
    
    const numRows = parseInt(rows);
    const numCols = parseInt(cols);
    
    if (isNaN(numRows) || isNaN(numCols) || numRows < 1 || numCols < 1) {
      alert('Jumlah baris dan kolom harus angka positif');
      return;
    }
    
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #E5E7EB;">';
    
    for (let i = 0; i < numRows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < numCols; j++) {
        const cellStyle = 'border: 1px solid #E5E7EB; padding: 8px; text-align: left;';
        if (i === 0) {
          // Header row
          tableHtml += `<th style="${cellStyle} background-color: #F3F4F6; font-weight: bold;">Header ${j + 1}</th>`;
        } else {
          tableHtml += `<td style="${cellStyle}">Cell ${i}-${j + 1}</td>`;
        }
      }
      tableHtml += '</tr>';
    }
    
    tableHtml += '</table>';
    
    document.execCommand('insertHTML', false, tableHtml);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 rounded-lg border-2 border-gray-200" style={{ backgroundColor: '#F5F5F5' }}>
        <button
          type="button"
          onClick={() => formatBlock('h1')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h2')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h3')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('bold')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Bold"
        >
          <Bold className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Italic"
        >
          <Italic className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Underline"
        >
          <Underline className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Bullet List"
        >
          <List className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => setAlignment('left')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => setAlignment('center')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => setAlignment('right')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <button
          type="button"
          onClick={() => setAlignment('justify')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={insertTable}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Insert Table"
        >
          <Table className="h-4 w-4" style={{ color: '#4A4A4A' }} />
        </button>
      </div>

      {/* ContentEditable Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[300px] p-4 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-yellow-400 overflow-auto prose prose-sm max-w-none"
        style={{
          backgroundColor: '#FFFFFC',
          color: '#1A1A1A',
        }}
        suppressContentEditableWarning
      />

      {/* Media Buttons */}
      <div className="flex gap-2 flex-wrap p-3 rounded-lg border border-gray-200" style={{ backgroundColor: '#F5F5F5' }}>
        <span className="text-xs font-semibold mr-2" style={{ color: '#4A4A4A', alignSelf: 'center' }}>
          Tambah Media:
        </span>
        <button
          type="button"
          onClick={onOpenVideoModal}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-orange-100 disabled:opacity-50"
          style={{ backgroundColor: '#FFF5F0', color: '#E87835' }}
          title="Add Video"
        >
          <Video className="h-4 w-4" />
          <span className="text-xs font-medium">Video</span>
        </button>
        <button
          type="button"
          onClick={onOpenImageModal}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-yellow-100 disabled:opacity-50"
          style={{ backgroundColor: '#FFFBEB', color: '#E8B824' }}
          title="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs font-medium">Gambar</span>
        </button>
        <button
          type="button"
          onClick={onOpenAudioModal}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-purple-100 disabled:opacity-50"
          style={{ backgroundColor: '#FAF5FF', color: '#9333EA' }}
          title="Add Audio"
        >
          <Music className="h-4 w-4" />
          <span className="text-xs font-medium">Audio</span>
        </button>
        <button
          type="button"
          onClick={onOpenLinkModal}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-cyan-100 disabled:opacity-50"
          style={{ backgroundColor: '#ECFEFF', color: '#0891B2' }}
          title="Add Link"
        >
          <Link2 className="h-4 w-4" />
          <span className="text-xs font-medium">Link</span>
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-xs" style={{ color: '#999999' }}>
        💡 Tip: Paste konten dari Word/Google Docs dengan formatting akan otomatis terdeteksi. Gunakan toolbar di atas untuk formatting tambahan.
      </p>
    </div>
  );
}

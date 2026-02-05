'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// Underline is included in StarterKit v3
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Code2, Eye, Type, Wand2 } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
import BannerBuilderModal from './BannerBuilderModal';
import { hasBanner, extractBannerData } from './bannerPresets';

type EditorMode = 'visual' | 'source' | 'preview';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  onBannerTitleChange?: (title: string, subtitle: string) => void;
  placeholder?: string;
  templateCategory?: 'agent' | 'sales';
  defaultTitle?: string;
  defaultSubtitle?: string;
}

// Helper: extract banner HTML from full content
function getBannerHtml(html: string): string {
  const match = html.match(/<!-- BANNER:START -->[\s\S]*?<!-- BANNER:END -->/);
  return match ? match[0] : '';
}

// Helper: extract body HTML (everything except banner)
function getBodyHtml(html: string): string {
  return html.replace(/<!-- BANNER:START -->[\s\S]*?<!-- BANNER:END -->\n?/, '');
}

// Helper: combine banner + body
function combineHtml(banner: string, body: string): string {
  if (!banner) return body;
  return `${banner}\n${body}`;
}

export default function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  onBannerTitleChange,
  placeholder = '상세 내용을 작성해주세요...',
  templateCategory,
  defaultTitle,
  defaultSubtitle,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>('visual');
  const [sourceCode, setSourceCode] = useState(value);
  const [showBannerBuilder, setShowBannerBuilder] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Store banner HTML separately (Tiptap strips HTML comments)
  // Both ref (for Tiptap callbacks) and state (for visual rendering)
  const bannerHtmlRef = useRef(getBannerHtml(value));
  const [bannerHtmlState, setBannerHtmlState] = useState(getBannerHtml(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // StarterKit v3 includes TextStyle and Underline
      }),
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ allowBase64: true, inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
    ],
    content: getBodyHtml(value),
    onUpdate: ({ editor }) => {
      const bodyHtml = editor.getHTML();
      const fullHtml = combineHtml(bannerHtmlRef.current, bodyHtml);
      onChange(fullHtml);
      setSourceCode(fullHtml);
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Sync external value changes into the editor
  useEffect(() => {
    if (!editor) return;
    const newBody = getBodyHtml(value);
    const currentBody = editor.getHTML();
    if (newBody !== currentBody) {
      const banner = getBannerHtml(value);
      bannerHtmlRef.current = banner;
      setBannerHtmlState(banner);
      editor.commands.setContent(newBody, { emitUpdate: false });
      setSourceCode(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleModeChange = useCallback((newMode: EditorMode) => {
    if (!editor) return;

    if (mode === 'source' && newMode !== 'source') {
      // HTML 소스 → 다른 모드: 소스에서 배너/본문 분리 후 에디터에 동기화
      const banner = getBannerHtml(sourceCode);
      bannerHtmlRef.current = banner;
      setBannerHtmlState(banner);
      const body = getBodyHtml(sourceCode);
      editor.commands.setContent(body, { emitUpdate: false });
      onChange(sourceCode);
    } else if (mode === 'visual' && newMode === 'source') {
      // 비주얼 → HTML: 에디터 내용 + 배너를 소스에 반영
      const bodyHtml = editor.getHTML();
      const fullHtml = combineHtml(bannerHtmlRef.current, bodyHtml);
      setSourceCode(fullHtml);
    } else if (mode === 'preview' && newMode === 'visual') {
      // 미리보기 → 비주얼: 본문만 에디터에 로드
      const body = getBodyHtml(sourceCode);
      const banner = getBannerHtml(sourceCode);
      bannerHtmlRef.current = banner;
      setBannerHtmlState(banner);
      const currentContent = body.replace(/<[^>]*>/g, '').trim();
      if (currentContent.length > 0) {
        const clearContent = window.confirm(
          '현재 작성된 내용을 삭제하고 새로 작성하시겠습니까?\n\n[확인] 내용 삭제 후 빈 에디터 열기\n[취소] 현재 내용 유지하며 편집'
        );
        if (clearContent) {
          editor.commands.setContent('', { emitUpdate: false });
          bannerHtmlRef.current = '';
          setSourceCode('');
          onChange('');
        } else {
          editor.commands.setContent(body, { emitUpdate: false });
        }
      } else {
        editor.commands.setContent(body, { emitUpdate: false });
      }
    } else if (mode === 'preview' && newMode === 'source') {
      // 미리보기 → HTML: sourceCode는 이미 최신, 배너 ref 동기화
      const banner = getBannerHtml(sourceCode);
      bannerHtmlRef.current = banner;
      setBannerHtmlState(banner);
    }

    setMode(newMode);
  }, [editor, mode, sourceCode, onChange]);

  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    setSourceCode(html);
    onChange(html);
    // 배너 ref + state 동기화
    const banner = getBannerHtml(html);
    bannerHtmlRef.current = banner;
    setBannerHtmlState(banner);
  }, [onChange]);

  const handleImageUploadClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (onImageUpload) {
      const url = await onImageUpload(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  }, [editor, onImageUpload]);

  // Banner builder apply handler
  // Banner HTML is stored in a ref (Tiptap strips comments/complex divs).
  // Template body goes directly into Tiptap for visual editing.
  const handleBannerApply = useCallback((newBannerHtml: string, templateHtml?: string) => {
    if (!editor) return;

    bannerHtmlRef.current = newBannerHtml;
    setBannerHtmlState(newBannerHtml);

    if (templateHtml) {
      // Template selected → load body into Tiptap, switch to visual for direct editing
      editor.commands.setContent(templateHtml, { emitUpdate: false });
      const fullHtml = combineHtml(newBannerHtml, templateHtml);
      setSourceCode(fullHtml);
      onChange(fullHtml);
      setMode('visual');
    } else {
      // Banner only → keep existing editor content
      const bodyHtml = editor.getHTML();
      const fullHtml = combineHtml(newBannerHtml, bodyHtml);
      setSourceCode(fullHtml);
      onChange(fullHtml);
      setMode('preview');
    }
  }, [editor, onChange]);

  // Extract existing banner data for re-editing (from raw value)
  const existingBannerData = hasBanner(sourceCode) ? extractBannerData(sourceCode) : null;

  if (!editor) return null;

  const modeButtons: { mode: EditorMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'visual', label: '비주얼', icon: <Type size={14} /> },
    { mode: 'source', label: 'HTML', icon: <Code2 size={14} /> },
    { mode: 'preview', label: '미리보기', icon: <Eye size={14} /> },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Mode Tabs + Template Builder Button */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        {/* Template Builder Button (leftmost, prominent) */}
        <div className="pl-2 pr-1">
          <button
            type="button"
            onClick={() => setShowBannerBuilder(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-lg transition-all shadow-sm"
          >
            <Wand2 size={14} />
            템플릿제작
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Mode Tabs */}
        <div className="flex">
          {modeButtons.map((btn) => (
            <button
              key={btn.mode}
              type="button"
              onClick={() => handleModeChange(btn.mode)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                mode === btn.mode
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar - only in visual mode */}
      {mode === 'visual' && (
        <EditorToolbar editor={editor} onImageUpload={handleImageUploadClick} />
      )}

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Editor Area */}
      <div className="min-h-[250px]">
        {mode === 'visual' && (
          <>
            {/* Banner preview above editor (banner HTML can't go through Tiptap) */}
            {bannerHtmlState && (
              <div
                className="job-html-content border-b border-gray-200"
                dangerouslySetInnerHTML={{ __html: bannerHtmlState }}
              />
            )}
            <EditorContent editor={editor} />
          </>
        )}

        {mode === 'source' && (
          <textarea
            value={sourceCode}
            onChange={handleSourceChange}
            className="w-full min-h-[250px] px-4 py-3 font-mono text-sm text-gray-800 bg-gray-50 focus:outline-none resize-y"
            placeholder="<p>HTML 코드를 직접 입력하세요...</p>"
            spellCheck={false}
          />
        )}

        {mode === 'preview' && (
          <div
            className="job-html-content px-4 py-3 min-h-[250px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sourceCode }}
          />
        )}
      </div>

      {/* Banner Builder Modal */}
      <BannerBuilderModal
        isOpen={showBannerBuilder}
        onClose={() => setShowBannerBuilder(false)}
        onApply={handleBannerApply}
        onImageUpload={onImageUpload}
        onTitleChange={onBannerTitleChange}
        defaultTitle={defaultTitle}
        defaultSubtitle={defaultSubtitle}
        existingBannerData={existingBannerData}
        templateCategory={templateCategory}
      />
    </div>
  );
}

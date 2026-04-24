'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered,
  ImageIcon, Table,
  Undo2, Redo2,
  Highlighter, Palette,
  Minus,
  ChevronDown,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload?: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5 flex-shrink-0" />;
}

export default function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const [showMore, setShowMore] = useState(false);
  const iconSize = 16;

  return (
    <div className="border-b border-gray-200 bg-gray-50/80 min-w-0 max-w-full overflow-hidden">
      {/* 기본 툴바: 가로 스크롤 (모바일 최적화) */}
      <div className="flex items-center overflow-x-auto scrollbar-hide px-1.5 py-1.5 gap-0.5 max-w-full">
        {/* Text Style */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="굵게"
        >
          <Bold size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="기울임"
        >
          <Italic size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="밑줄"
        >
          <Underline size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="취소선"
        >
          <Strikethrough size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="제목"
        >
          <Heading2 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="소제목"
        >
          <Heading3 size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="글머리 기호"
        >
          <List size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="번호 매기기"
        >
          <ListOrdered size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        {onImageUpload && (
          <ToolbarButton
            onClick={onImageUpload}
            title="이미지 삽입"
          >
            <ImageIcon size={iconSize} />
          </ToolbarButton>
        )}

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="실행 취소"
        >
          <Undo2 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="다시 실행"
        >
          <Redo2 size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* 더보기 토글 */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 text-gray-500 hover:bg-gray-100 ${showMore ? 'bg-gray-200 text-gray-700' : ''}`}
          title="서식 더보기"
        >
          <ChevronDown size={iconSize} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 확장 툴바 (더보기) */}
      {showMore && (
        <div className="flex items-center overflow-x-auto scrollbar-hide px-1.5 py-1.5 gap-0.5 border-t border-gray-200/80 bg-gray-50/50 max-w-full">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="제목 1"
          >
            <Heading1 size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="형광펜"
          >
            <Highlighter size={iconSize} />
          </ToolbarButton>

          <Divider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="왼쪽 정렬"
          >
            <AlignLeft size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="가운데 정렬"
          >
            <AlignCenter size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="오른쪽 정렬"
          >
            <AlignRight size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="양쪽 정렬"
          >
            <AlignJustify size={iconSize} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="표 삽입"
          >
            <Table size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="구분선"
          >
            <Minus size={iconSize} />
          </ToolbarButton>

          <Divider />

          {/* Color picker */}
          <div className="relative flex-shrink-0">
            <label title="글자 색상" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer flex items-center">
              <Palette size={iconSize} />
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="absolute w-0 h-0 opacity-0"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

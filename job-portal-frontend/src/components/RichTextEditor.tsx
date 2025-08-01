'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Code,
  ImageIcon,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCallback, useRef, useState, useEffect } from 'react';

// Create lowlight instance
const lowlight = createLowlight();

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>; // Returns image URL after upload
}

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  disabled = false,
  onImageUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline hover:text-blue-300',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-slate-700 text-green-300 p-4 rounded-lg border border-slate-600',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editable: !disabled,
    immediatelyRender: false, // Prevent SSR hydration mismatch
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleImageUpload = useCallback(async () => {
    if (!editor || !onImageUpload) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          console.log('Starting image upload in editor:', file.name);
          
          // Insert loading placeholder at cursor position
          const loadingId = `loading-${Date.now()}`;
          editor.chain().focus().insertContent(
            `<span id="${loadingId}" style="color: #60a5fa; background: #1e293b; padding: 4px 8px; border-radius: 4px;">📤 Uploading ${file.name}...</span>`
          ).run();
          
          const imageUrl = await onImageUpload(file);
          console.log('Image upload successful, URL:', imageUrl);
          
          // Use TipTap's proper image insertion method
          // First remove the loading placeholder
          const currentContent = editor.getHTML();
          const updatedContent = currentContent.replace(
            `<span id="${loadingId}" style="color: #60a5fa; background: #1e293b; padding: 4px 8px; border-radius: 4px;">📤 Uploading ${file.name}...</span>`,
            ``
          );
          editor.commands.setContent(updatedContent);
          
          // Then insert the image at cursor position
          editor.chain().focus().setImage({ 
            src: imageUrl, 
            alt: file.name
          }).run();
          
          console.log('Image inserted into editor successfully');
          
        } catch (error) {
          console.error('Image upload failed in editor:', error);
          
          // Replace loading with error message
          const currentContent = editor.getHTML();
          const updatedContent = currentContent.replace(
            new RegExp(`<span id="loading-\\d+" style="color: #60a5fa; background: #1e293b; padding: 4px 8px; border-radius: 4px;">📤 Uploading ${file.name}...</span>`, 'g'),
            '<span style="color: #ef4444; background: #1e293b; padding: 4px 8px; border-radius: 4px;">❌ Image upload failed</span>'
          );
          editor.commands.setContent(updatedContent);
        }
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  const insertImageUrl = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // Don't render until mounted on client
  if (!isMounted || !editor) {
    return (
      <div className={`border border-slate-600 rounded-lg overflow-hidden bg-slate-900 shadow-lg ${className}`}>
        <div className="border-b border-slate-600 bg-gradient-to-r from-slate-800 to-slate-700 p-3">
          <div className="animate-pulse flex space-x-2">
            <div className="h-8 w-8 bg-slate-600 rounded"></div>
            <div className="h-8 w-8 bg-slate-600 rounded"></div>
            <div className="h-8 w-8 bg-slate-600 rounded"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-slate-600 rounded-lg overflow-hidden bg-slate-900 shadow-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-slate-600 bg-gradient-to-r from-slate-800 to-slate-700 p-3 flex flex-wrap items-center gap-1 sticky top-0 z-10">
        {/* Text formatting */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('bold') 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('italic') 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Headings */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('heading', { level: 1 }) 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('heading', { level: 2 }) 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('heading', { level: 3 }) 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('paragraph') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('paragraph') 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Lists */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('bulletList') 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('orderedList') 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive('blockquote') 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Alignment */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive({ textAlign: 'left' }) 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive({ textAlign: 'center' }) 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              editor.isActive({ textAlign: 'right' }) 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'text-gray-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Code Block */}
        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={disabled}
          className={`h-8 w-8 p-0 mr-2 ${
            editor.isActive('codeBlock') 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'text-gray-300 hover:text-white hover:bg-slate-600'
          }`}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Images */}
        <div className="flex items-center gap-1 mr-2">
          {onImageUpload && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageUpload}
              disabled={disabled}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-slate-600"
              title="Upload Image"
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertImageUrl}
            disabled={disabled}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-slate-600"
            title="Insert Image URL"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Link */}
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={setLink}
          disabled={disabled}
          className={`h-8 w-8 p-0 mr-2 ${
            editor.isActive('link') 
              ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
              : 'text-gray-300 hover:text-white hover:bg-slate-600'
          }`}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-slate-500" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-slate-600 disabled:text-gray-500 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-slate-600 disabled:text-gray-500 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm prose-invert max-w-none p-6 min-h-[200px] focus-within:outline-none bg-slate-900 text-white [&_.ProseMirror]:text-white [&_.ProseMirror]:bg-slate-900 [&_.ProseMirror]:border-none [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-white [&_.ProseMirror_p]:text-gray-100 [&_.ProseMirror_ul]:text-gray-100 [&_.ProseMirror_ol]:text-gray-100 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-blue-500 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-gray-300"
        />
        {!editor.getText() && (
          <div className="absolute top-6 left-6 text-gray-500 pointer-events-none text-lg">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';

// Toolbar button — `active` highlights the current formatting state.
function TBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || false}
      data-active={active ? 'true' : 'false'}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      className="ml-editor-btn"
    >
      {children}
    </button>
  );
}

const FONT_SIZES = [
  { label: 'Small', value: '14px' },
  { label: 'Normal', value: '' },
  { label: 'Large', value: '22px' },
  { label: 'X-Large', value: '28px' },
];

/**
 * Reusable WYSIWYG editor. `value`/`onChange` carry an HTML string so it drops
 * straight into the existing lesson form state and API calls.
 */
function RichTextEditor({ value, onChange, placeholder = 'Write the lesson…' }) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontSize],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap emits "<p></p>" for an empty doc — normalize to empty string.
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: { 'data-placeholder': placeholder },
    },
  });

  // Sync when the value changes externally (e.g. EditLesson loads async).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next !== current && !(next === '' && current === '<p></p>')) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const currentSize = editor.getAttributes('textStyle').fontSize || '';

  const onSizeChange = (e) => {
    const size = e.target.value;
    if (size) editor.chain().focus().setFontSize(size).run();
    else editor.chain().focus().unsetFontSize().run();
  };

  return (
    <div className="ml-editor">
      <div className="ml-editor-toolbar">
        <TBtn title="Bold" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </TBtn>
        <TBtn title="Italic" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </TBtn>
        <TBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </TBtn>
        <TBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </TBtn>
        <TBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </TBtn>
        <TBtn title="Bullet list" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </TBtn>
        <TBtn title="Numbered list" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </TBtn>
        <TBtn title="Quote" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </TBtn>
        <select
          className="ml-editor-select"
          title="Font size"
          aria-label="Font size"
          value={currentSize}
          onChange={onSizeChange}
        >
          {FONT_SIZES.map((s) => (
            <option key={s.label} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;

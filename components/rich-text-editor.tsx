"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextAlign } from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Highlight } from "@tiptap/extension-highlight"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  Undo,
  Redo,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useState } from "react" // Add this import

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const colors = [
  { name: "Black", value: "#000000" },
  { name: "Blue", value: "#2563eb" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#9333ea" },
  { name: "Orange", value: "#ea580c" },
]

const highlights = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
]

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Initialize editor only on the client side
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none border border-input rounded-md bg-background",
      },
    },
    immediatelyRender: false, // Add this line as the error suggested
  })

  // Set isMounted to true on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Return null during SSR and initial hydration
  if (!isMounted || !editor) {
    return (
      <div className="border border-input rounded-lg overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/30">
          {/* Placeholder toolbar */}
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="w-px h-6 bg-border mx-1" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="min-h-[200px] p-4 border border-input rounded-md bg-background">
          {/* Loading placeholder */}
          <div className="h-4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 bg-muted rounded animate-pulse mb-2 w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="border border-input rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <p className="text-xs font-medium">Text Color</p>
              <div className="grid grid-cols-3 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <p className="text-xs font-medium">Highlight</p>
              <div className="grid grid-cols-2 gap-2">
                {highlights.map((highlight) => (
                  <button
                    key={highlight.value}
                    type="button"
                    className="w-full h-8 rounded border-2 border-border hover:scale-105 transition-transform"
                    style={{ backgroundColor: highlight.value }}
                    onClick={() => editor.chain().focus().toggleHighlight({ color: highlight.value }).run()}
                    title={highlight.name}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
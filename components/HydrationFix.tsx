'use client';
export function HydrationFix() {
  return (
    <script
      id="hydration-fix"
      dangerouslySetInnerHTML={{
        __html: `
          if (document.body.hasAttribute('cz-shortcut-listen')) {
            document.body.removeAttribute('cz-shortcut-listen');
          }
        `,
      }}
    />
  );
}
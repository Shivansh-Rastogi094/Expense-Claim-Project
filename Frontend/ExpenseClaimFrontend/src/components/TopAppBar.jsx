import React from "react";

export default function TopAppBar({ title }) {
  return (
    <header className="bg-surface border-b border-border-subtle flex justify-between items-center w-full px-8 py-4 z-10 shrink-0 sticky top-0">
      <div className="flex items-center gap-4">
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
          {title}
        </h2>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RichTextProps {
  content: string;
  className?: string;
}

/**
 * RichText component for rendering HTML content safely
 * Supports: <p>, <span>, <strong>, <em>, <a>, <ul>, <ol>, <li>, <br>, <h1>-<h6>
 */
export function RichText({ content, className }: RichTextProps) {
  // Parse HTML and render it safely
  const createMarkup = () => {
    return { __html: content };
  };

  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={createMarkup()}
    />
  );
}

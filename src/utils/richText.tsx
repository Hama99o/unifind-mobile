/**
 * richText.tsx — Strapi rich-text renderer for React Native.
 *
 * Strapi v5 stores rich text as an array of block objects:
 *   { type: 'paragraph', children: [{ type: 'text', text: '...' }] }
 *
 * This util renders them into Gluestack Text/Heading components.
 * No raw RN Text — all copy through Gluestack components.
 */

import React from "react";
import { View, Pressable, Linking } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RichTextChild {
  type: "text" | "link" | string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
  children?: RichTextChild[];
}

interface RichTextBlock {
  type:
    | "paragraph"
    | "heading"
    | "list"
    | "list-item"
    | "quote"
    | "code"
    | string;
  level?: number;
  format?: "ordered" | "unordered";
  children?: RichTextChild[];
}

// ─── Child renderer ──────────────────────────────────────────────────────────

function renderChild(child: RichTextChild, key: number): React.ReactNode {
  if (!child) return null;

  if (child.type === "link") {
    const nested = (child.children ?? []).map((c) => c.text ?? "").join("");
    const linkText = nested || (child.url ?? "");
    const url = child.url ?? "";
    const handlePress = () => {
      if (!url) return;
      const href = url.startsWith("http") ? url : `https://${url}`;
      Linking.openURL(href).catch(() => {});
    };
    return (
      <Pressable key={key} onPress={handlePress}>
        <Text className="text-primary underline">
          {linkText}
        </Text>
      </Pressable>
    );
  }

  const text = child.text ?? "";
  if (!text) {
    if (Array.isArray(child.children)) {
      return <React.Fragment key={key}>{child.children.map((c, i) => renderChild(c, i))}</React.Fragment>;
    }
    return null;
  }

  const parts = [
    "text-foreground",
    child.bold ? "font-bold" : "",
    child.italic ? "italic" : "",
    child.underline ? "underline" : "",
  ].filter(Boolean);

  const classes = parts.join(" ");

  return (
    <Text key={key} className={classes}>
      {text}
    </Text>
  );
}

// ─── Block renderer ──────────────────────────────────────────────────────────

function renderBlock(block: RichTextBlock, key: number): React.ReactNode {
  if (!block) return null;
  const children = block.children ?? [];

  switch (block.type) {
    case "paragraph":
      return (
        <Text key={key} className="text-foreground text-sm leading-relaxed mb-2">
          {children.map((c, i) => renderChild(c, i))}
        </Text>
      );

    case "heading": {
      const level = block.level ?? 2;
      type HeadingSize = "xl" | "lg" | "md" | "sm";
      const sizeMap: Record<number, HeadingSize> = {
        1: "xl",
        2: "lg",
        3: "md",
        4: "sm",
        5: "sm",
        6: "sm",
      };
      const size: HeadingSize = sizeMap[level] ?? "md";
      return (
        <Heading key={key} size={size} className="text-foreground mb-1">
          {children.map((c, i) => renderChild(c, i))}
        </Heading>
      );
    }

    case "list": {
      const isOrdered = block.format === "ordered";
      return (
        <View key={key} className="mb-2 pl-2">
          {children.map((item, i) => {
            const itemChildren = item.children ?? [];
            return (
              <View key={i} className="flex-row items-start mb-1">
                <Text className="text-foreground text-sm mr-2">
                  {isOrdered ? `${i + 1}.` : "•"}
                </Text>
                <Text className="flex-1 text-foreground text-sm leading-relaxed">
                  {itemChildren.map((c, j) => renderChild(c, j))}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    case "quote":
      return (
        <View key={key} className="border-l-4 border-primary pl-3 my-2">
          <Text className="text-muted-foreground text-sm italic">
            {children.map((c, i) => renderChild(c, i))}
          </Text>
        </View>
      );

    case "code":
      return (
        <View key={key} className="bg-muted rounded p-2 my-1">
          <Text className="text-foreground text-xs font-mono">
            {children.map((c, i) => renderChild(c, i))}
          </Text>
        </View>
      );

    default:
      if (children.length > 0) {
        return (
          <Text key={key} className="text-foreground text-sm mb-1">
            {children.map((c, i) => renderChild(c, i))}
          </Text>
        );
      }
      return null;
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Render a Strapi rich-text array into React Native Gluestack Text/Heading nodes.
 * If `value` is a plain string, renders it as a single paragraph.
 */
export function renderStrapiRichText(value: unknown): React.ReactNode {
  if (!value) return null;

  if (typeof value === "string") {
    return <Text className="text-foreground text-sm leading-relaxed">{value}</Text>;
  }

  if (Array.isArray(value)) {
    return <>{value.map((block, i) => renderBlock(block as RichTextBlock, i))}</>;
  }

  return null;
}

/** Extract plain text from a Strapi rich-text value (for descriptions/excerpts). */
export function extractPlainTextFromRich(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  const texts: string[] = [];

  function collectText(node: RichTextChild | RichTextBlock) {
    if ("text" in node && typeof node.text === "string") {
      texts.push(node.text);
    }
    const nodeChildren = (node as RichTextBlock).children;
    if (Array.isArray(nodeChildren)) {
      for (const child of nodeChildren) {
        collectText(child as RichTextChild);
      }
    }
  }

  for (const block of value as RichTextBlock[]) {
    collectText(block);
  }

  return texts.join(" ").trim();
}

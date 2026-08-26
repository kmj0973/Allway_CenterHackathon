import { Fragment, type ReactNode } from "react";

import logo from "@/assets/brand/logo.svg";
import logoGradient from "@/assets/brand/logo-gradient.svg";
import { cn } from "@/utils/cn";

interface AiAnswerProps {
  content: string;
  variant?: "chat" | "home";
}

function renderInlineMarkdown(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${index}-${part}`} className="font-bold">{part.slice(2, -2)}</strong>;
    }

    return <Fragment key={`${index}-${part}`}>{part}</Fragment>;
  });
}

function AiAnswer({ content, variant = "chat" }: AiAnswerProps) {
  const isHome = variant === "home";
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <img
        aria-hidden
        src={isHome ? logoGradient : logo}
        alt=""
        className="size-7"
      />

      <div
        className={cn(
          "flex flex-col gap-2",
          isHome ? "max-w-65.75 text-[#473787]/90" : "text-chat-fg/90",
        )}
      >
        {lines.map((line, index) => {
          const numberedHeading = line.match(/^(\d+[.)])\s+\*\*(.+)\*\*$/);
          if (numberedHeading) {
            return (
              <h3
                key={`${index}-${line}`}
                className={cn(
                  "text-[1.0625rem] leading-[1.45] font-bold tracking-tight",
                  index > 0 && "mt-2",
                )}
              >
                {numberedHeading[1]} {numberedHeading[2]}
              </h3>
            );
          }

          const heading = line.match(/^(#{1,3})\s+(.+)$/);
          if (heading) {
            return (
              <h3
                key={`${index}-${line}`}
                className={cn(
                  "leading-[1.45] font-bold tracking-tight",
                  heading[1].length === 1 ? "text-heading" : "text-[1.0625rem]",
                  index > 0 && "mt-2",
                )}
              >
                {renderInlineMarkdown(heading[2])}
              </h3>
            );
          }

          const listItem = line.match(/^[-*]\s+(.+)$/);
          if (listItem) {
            return (
              <p
                key={`${index}-${line}`}
                className="text-body flex gap-2 leading-normal font-medium tracking-tight"
              >
                <span aria-hidden>•</span>
                <span>{renderInlineMarkdown(listItem[1])}</span>
              </p>
            );
          }

          return (
            <p
              key={`${index}-${line}`}
              className="text-body leading-normal font-medium tracking-tight"
            >
              {renderInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default AiAnswer;

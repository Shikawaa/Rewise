import React from "react";
import { cn } from "../../lib/utils";

const Markdown = ({ content, className }) => {
  if (!content) return null;

  // Diviser le contenu par paragraphes
  const paragraphs = content.split("\n\n").filter(p => p.trim());

  return (
    <div className={cn("markdown-content", className)}>
      {paragraphs.map((paragraph, index) => {
        // Titre principal (H1)
        if (paragraph.startsWith("# ")) {
          const titleText = paragraph.replace(/^#\s+/, "");
          return (
            <h1 key={index} className="text-2xl font-semibold text-purple-600 mb-4">
              {titleText}
            </h1>
          );
        }
        
        // Titre secondaire (H2)
        if (paragraph.startsWith("## ")) {
          const titleText = paragraph.replace(/^##\s+/, "");
          return (
            <h2 key={index} className="text-xl font-semibold text-purple-600 mt-6 mb-3">
              {titleText}
            </h2>
          );
        }
        
        // Liste à puces
        if (paragraph.includes("\n- ") || paragraph.includes("\n* ")) {
          const lines = paragraph.split("\n").filter(line => line.trim());
          
          // Vérifier si le premier élément est un titre de liste
          const hasTitle = !lines[0].trim().startsWith("-") && !lines[0].trim().startsWith("*");
          const title = hasTitle ? lines.shift() : null;
          
          return (
            <div key={index} className="my-4">
              {title && (
                <p className="font-medium text-gray-800 mb-2">{title}</p>
              )}
              <ul className="list-disc ml-6 space-y-2">
                {lines.map((item, i) => (
                  <li key={i} className="text-gray-800">
                    {item.replace(/^[*-]\s/, "")}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        
        // Paragraphe standard
        return (
          <p key={index} className="text-gray-800 leading-relaxed mb-4">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
};

export { Markdown }; 
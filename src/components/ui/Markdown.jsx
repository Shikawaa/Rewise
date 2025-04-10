import React from "react";
import { cn } from "../../lib/utils";

const Markdown = ({ content, className }) => {
  if (!content) return null;

  // Diviser le contenu par paragraphes
  const paragraphs = content.split("\n\n").filter(p => p.trim());
  
  // Tableau pour stocker les éléments rendus
  const renderedElements = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const nextParagraph = i < paragraphs.length - 1 ? paragraphs[i + 1] : null;
    
    // Vérifier si le paragraphe suivant est une liste
    const isNextParagraphList = nextParagraph && 
      (nextParagraph.includes("\n- ") || nextParagraph.includes("\n* "));
    
    // Titre principal (H1)
    if (paragraph.startsWith("# ")) {
      const titleText = paragraph.replace(/^#\s+/, "");
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-semibold text-purple-600 mb-4">
          {titleText}
        </h1>
      );
      continue;
    }
    
    // Titre secondaire (H2)
    if (paragraph.startsWith("## ")) {
      const titleText = paragraph.replace(/^##\s+/, "");
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-xl font-semibold text-purple-600 mt-6 mb-3">
          {titleText}
        </h2>
      );
      continue;
    }
    
    // Liste à puces
    if (paragraph.includes("\n- ") || paragraph.includes("\n* ")) {
      const lines = paragraph.split("\n").filter(line => line.trim());
      
      // Vérifier si le premier élément est un titre de liste
      const hasTitle = !lines[0].trim().startsWith("-") && !lines[0].trim().startsWith("*");
      const title = hasTitle ? lines.shift() : null;
      
      renderedElements.push(
        <div key={`list-${i}`} className={i > 0 && !hasTitle ? "-mt-4" : "mt-2"}>
          {title && (
            <p className="font-medium text-gray-800 mb-1">{title}</p>
          )}
          <ul className="list-disc ml-6 space-y-1">
            {lines.map((item, i) => (
              <li key={i} className="text-gray-800">
                {item.replace(/^[*-]\s/, "")}
              </li>
            ))}
          </ul>
        </div>
      );
      continue;
    }
    
    // Paragraphe standard
    renderedElements.push(
      <p 
        key={`p-${i}`} 
        className={`text-gray-800 leading-relaxed ${isNextParagraphList ? 'mb-1' : 'mb-4'}`}
      >
        {paragraph}
      </p>
    );
    
    // Si le paragraphe suivant est une liste, on saute ce paragraphe
    // pour éviter de le traiter à nouveau
    if (isNextParagraphList) {
      // On prend les lignes de la liste
      const lines = nextParagraph.split("\n").filter(line => line.trim());
      
      // Vérifier si le premier élément est un titre de liste
      const hasTitle = !lines[0].trim().startsWith("-") && !lines[0].trim().startsWith("*");
      const title = hasTitle ? lines.shift() : null;
      
      renderedElements.push(
        <div key={`list-after-p-${i}`} className="-mt-2">
          {title && (
            <p className="font-medium text-gray-800 mb-1">{title}</p>
          )}
          <ul className="list-disc ml-6 space-y-1">
            {lines.map((item, idx) => (
              <li key={idx} className="text-gray-800">
                {item.replace(/^[*-]\s/, "")}
              </li>
            ))}
          </ul>
        </div>
      );
      
      // On incrémente i pour sauter le paragraphe suivant
      i++;
    }
  }

  return (
    <div className={cn("markdown-content", className)}>
      {renderedElements}
    </div>
  );
};

export { Markdown }; 
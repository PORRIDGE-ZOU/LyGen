// WordCloudGenerator.tsx

import React, { useEffect } from "react";
import cloud, { Word } from "d3-cloud";
import { scaleLinear } from "d3-scale";

interface WordCloudGeneratorProps {
  words: string[];
  importanceValues: number[];
  width: number;
  height: number;
  onLayoutComplete: (
    layout: {
      word: string;
      x: number;
      y: number;
      size: number;
      rotate: number;
    }[]
  ) => void;
}

const WordCloudGenerator: React.FC<WordCloudGeneratorProps> = ({
  words,
  importanceValues,
  width,
  height,
  onLayoutComplete,
}) => {
  useEffect(() => {
    // Map words and importanceValues to word objects
    const wordObjects = words.map((word, index) => ({
      text: word,
      importance: importanceValues[index],
    }));

    // Map importance values to font sizes
    const fontSizeScale = scaleLinear()
      .domain([0, 1]) // Importance values range from 0 to 1
      .range([20, 100]); // Font sizes range from 20 to 100 pixels (adjust as needed)

    const layoutWords: Word[] = wordObjects.map((d) => ({
      text: d.text,
      size: fontSizeScale(d.importance),
    }));

    const layout = cloud()
      .size([width, height])
      .words(layoutWords)
      .padding(5) // Space between words
      .rotate(0) // No rotation; set to (d) => (Math.random() * 2) * 90 for random rotation
      .fontSize((d) => d.size as number)
      .on("end", (computedWords: Word[]) => {
        // Adjust positions to center the layout
        const layoutResult = computedWords.map((d) => ({
          word: d.text as string,
          x: (d.x as number) + width / 2,
          y: (d.y as number) + height / 2,
          size: d.size as number,
          rotate: d.rotate as number,
        }));

        // Pass the calculated layout back to the parent component
        onLayoutComplete(layoutResult);
      });

    layout.start();
  }, [words, importanceValues, width, height, onLayoutComplete]);

  return null; // This component doesn't render anything visible
};

export default WordCloudGenerator;

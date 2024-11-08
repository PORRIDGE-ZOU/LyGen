import React, { useState, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
  root: {
    overflowY: "auto",
    maxHeight: "45vh", // Set a fixed height to prevent overflow
    width: "100%",
    padding: "10px",
    boxSizing: "border-box",
  },
  line: {
    padding: "8px 12px",
    margin: "4px 0",
    cursor: "pointer",
    userSelect: "text",
    whiteSpace: "pre-wrap",
    textAlign: "center",
    overflowWrap: "break-word",
    borderRadius: "5px",
    transition: "background-color 0.3s",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
  selectedLine: {
    backgroundColor: "#d0d0d0",
    fontWeight: "bold",
  },
});
interface LyricsColumnProps {
  lyrics: string[][];
  onLineClick: (lineIndex: number) => void;
}

const LyricsColumn = ({ lyrics, onLineClick }: LyricsColumnProps) => {
  const classes = useStyles();
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(
    null
  );

  const selectedLineRef = useRef<HTMLDivElement | null>(null);

  const handleLineClick = (index: number) => {
    setSelectedLineIndex(index);
    onLineClick(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      console.log("Return key pressed");
      // Future functionality: Split the line or create a new panel
    } else if (event.key === " ") {
      console.log("Space key pressed");
      // Handle Space key if needed
    }
  };

  useEffect(() => {
    if (selectedLineRef.current) {
      selectedLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedLineIndex]);

  return (
    <Box className={classes.root} tabIndex={0} onKeyDown={handleKeyDown}>
      {lyrics.map((lineWords, index) => (
        <div
          key={index}
          className={`${classes.line} ${
            selectedLineIndex === index ? classes.selectedLine : ""
          }`}
          onClick={() => handleLineClick(index)}
          ref={selectedLineIndex === index ? selectedLineRef : null}
        >
          {lineWords.join(" ")}
        </div>
      ))}
    </Box>
  );
};

export default LyricsColumn;

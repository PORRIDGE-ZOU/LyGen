import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  TextField,
  Typography,
  Container,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { globalRegulator } from "@/helpers/globals";
import ColorPickerInput from "./ColorPickerInput";
// Import the animation presets
import { animationPresets } from "@/helpers/globals";
import WordCloudGenerator from "./WordCloudGenerator";
import { set } from "animejs";

interface ImportanceTabProps {
  lyrics: string[][];
  onImportanceChange: (lineIndex: number, importanceValues: number[]) => void;
  onCustomizationChange: (customizations: Customization[]) => void;
  onAnimationChange: (lineIndex: number, animation: string) => void;
  onWordCloudLayoutComplete: (
    lineIndex: number,
    layout: {
      word: string;
      x: number;
      y: number;
      size: number;
      rotate: number;
    }[]
  ) => void;
}

export interface Customization {
  type: string; // e.g., "resize", "slow down"
  factor: number; // The user-defined factor
}

const availableCustomizations = [
  "Enlarge by",
  "Slow down animation by",
  "Shift color",
]; // Available definitions

const ImportanceTab: React.FC<ImportanceTabProps> = ({
  lyrics,
  onImportanceChange,
  onCustomizationChange,
  onAnimationChange,
  onWordCloudLayoutComplete,
}) => {
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [importanceValues, setImportanceValues] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [customizations, setCustomizations] = useState<Customization[]>([]); // Store customizations
  const [impColor, setImpColor] = useState<string>("#ffffff");

  // Store selected animations for each line
  const [lineAnimations, setLineAnimations] = useState<{
    [key: number]: string;
  }>({});

  const [useWordCloud, setUseWordCloud] = useState(false);
  const [wordCloudWords, setWordCloudWords] = useState<string[]>([]);

  // Importance Curve ----------------
  // Initialize importance values and wordcloud words when selected line changes
  useEffect(() => {
    const wordsInLine = lyrics[selectedLineIndex]?.length || 0;
    setImportanceValues(Array(wordsInLine).fill(0.5)); // Default importance 0.5
    setWordCloudWords(lyrics[selectedLineIndex] || []);
  }, [selectedLineIndex, lyrics]);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    onImportanceChange(selectedLineIndex, importanceValues);
  }, [importanceValues]);

  // Handle dot dragging
  const handleDotDrag = (index: number, newImportance: number) => {
    const clampedImportance = Math.max(0, Math.min(1, newImportance));
    setImportanceValues((prevValues) => {
      const updatedValues = [...prevValues];
      updatedValues[index] = clampedImportance;
      return updatedValues; // Return the updated values to apply them
    });
  };

  // Calculate dimensions
  const graphHeight = 200;
  const wordSpacing = 100; // Adjust as needed
  const totalWidth = (lyrics[selectedLineIndex]?.length || 0) * wordSpacing;

  // Left offset for y-axis labels
  const xOffset = 30;

  // Customizations ----------------
  useEffect(() => {
    onCustomizationChange(customizations);
  }, [customizations]);

  const addCustomization = (type: string) => {
    setCustomizations([...customizations, { type, factor: 1 }]); // Default factor of 1
  };

  const removeCustomization = (index: number) => {
    const updated = [...customizations];
    updated.splice(index, 1);
    setCustomizations(updated);
  };

  const handleFactorChange = (index: number, factor: number) => {
    const updated = [...customizations];
    updated[index].factor = factor;
    setCustomizations(updated);
  };

  const handleColorChange = (newcolor: string, index: number) => {
    setImpColor(newcolor);
    // newcolor is a hex color string. convert it to rgb
    // Remove the leading '#' if it's there
    let hex = newcolor.replace(/^#/, "");
    // Parse the r, g, b values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    let rgbencode = rgbToNumber(r, g, b);
    handleFactorChange(index, rgbencode);
  };

  // Handle animation change
  const handleAnimationChange = (animation: string) => {
    setLineAnimations((prevAnimations) => ({
      ...prevAnimations,
      [selectedLineIndex]: animation,
    }));
    onAnimationChange(selectedLineIndex, animation);
  };

  // Word Cloud ----------------
  const handleLayoutComplete = (
    layout: {
      word: string;
      x: number;
      y: number;
      size: number;
      rotate: number;
    }[]
  ) => {
    console.log("Word cloud layout complete!", layout);
  };

  // UI for Customizations
  const renderCustomizations = () => (
    <Container>
      <Typography variant="h6" fontFamily={"Cormorant Garamond"}>
        Define what importance means!
      </Typography>
      <Typography variant="body1" fontFamily={"Cormorant Garamond"}>
        By changing the importance of a word from 0.5 to 1, I want the word
        to...
      </Typography>
      <Box mt={2}>
        {customizations.map((customization, index) =>
          customization.type === "Shift color" ? (
            <Box key={index} display="flex" alignItems="center" mb={1}>
              <span>{customization.type} (in gradient) toward </span>
              <ColorPickerInput
                color={impColor}
                setColor={(color) => handleColorChange(color, index)}
                text={impColor}
                setText={(color) => handleColorChange(color, index)}
              ></ColorPickerInput>
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => removeCustomization(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box key={index} display="flex" alignItems="center" mb={1}>
              <span>{customization.type}</span>
              <TextField
                type="number"
                value={customization.factor}
                onChange={(e) =>
                  handleFactorChange(index, parseFloat(e.target.value))
                }
                size="small"
                style={{ marginLeft: 8, marginRight: 8, width: "60px" }}
              />
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => removeCustomization(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        )}
        {/* Add New Customization */}
        <FormControl fullWidth variant="outlined" margin="dense">
          <InputLabel>Add Customization</InputLabel>
          <Select
            onChange={(e) => addCustomization(e.target.value as string)}
            value=""
          >
            {availableCustomizations
              .filter((type) => !customizations.some((c) => c.type === type)) // Exclude already added
              .map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>
    </Container>
  );

  return (
    <Box>
      {/* Dropdown Menu for Lyrics */}
      <FormControl fullWidth variant="outlined" margin="dense">
        <InputLabel>Select Lyric Line</InputLabel>
        <Select
          value={selectedLineIndex}
          onChange={(e) => setSelectedLineIndex(Number(e.target.value))}
          label="Select Lyric Line"
        >
          {lyrics.map((line, index) => (
            <MenuItem key={index} value={index}>
              {line.join(" ")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Dropdown Menu for Animation */}
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel>Select animation for this line</InputLabel>
        <Select
          value={lineAnimations[selectedLineIndex] || ""}
          onChange={(e) => handleAnimationChange(e.target.value as string)}
          label="Select Animation"
        >
          {animationPresets.map((animation) => (
            <MenuItem key={animation} value={animation}>
              {animation}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Curve Graph */}
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          overflowX: "auto",
          overflowY: "auto",
          border: "1px solid #ccc",
          marginTop: 2,
          maxHeight: "300px",
          paddingLeft: `${xOffset}px`, // Add left padding for y-axis labels
        }}
      >
        <svg
          width={Math.max(containerWidth, totalWidth)}
          height={graphHeight}
          style={{ display: "block" }}
        >
          {/* Y-Axis Lines and Labels */}
          {renderYAxis()}

          {/* Draw the curve */}
          <path
            d={generateCurvePath(importanceValues, wordSpacing, graphHeight)}
            fill="none"
            stroke="#3f51b5"
            strokeWidth="2"
          />

          {/* Draggable Dots */}
          {importanceValues.map((importance, index) => (
            <circle
              key={index}
              cx={index * wordSpacing + wordSpacing / 2 + xOffset}
              cy={valueToYPosition(importance)}
              r="8"
              fill="#3f51b5"
              style={{ cursor: "pointer" }}
              onMouseDown={(e) => handleMouseDown(e, index)}
            />
          ))}

          {/* Word Labels */}
          {lyrics[selectedLineIndex]?.map((word, index) => (
            <text
              key={index}
              x={index * wordSpacing + wordSpacing / 2 + xOffset}
              y={graphHeight - 5}
              textAnchor="middle"
              fontSize="12"
            >
              {word}
            </text>
          ))}
        </svg>
      </Box>

      {/* Customizations */}
      {renderCustomizations()}

      {/* Word Cloud */}
      <FormControlLabel
        control={
          <Checkbox
            checked={useWordCloud}
            onChange={(e) => setUseWordCloud(e.target.checked)}
          />
        }
        label="I want to use Wordcloud for this line"
      />
      <div>
        {/* <WordCloudGenerator
          words={wordCloudWords}
          importanceValues={importanceValues}
          width={960}
          height={540}
          onLayoutComplete={handleLayoutComplete}
        /> */}
        {/* Render your Fabric.js canvas here and use 'layout' to position words */}
      </div>
    </Box>
  );

  // Helper Functions -----------------

  function handleMouseDown(
    e: React.MouseEvent<SVGCircleElement, MouseEvent>,
    index: number
  ) {
    e.preventDefault();
    const svgElement = e.currentTarget.ownerSVGElement;
    if (!svgElement) return;

    const startY = e.clientY;
    const svgRect = svgElement.getBoundingClientRect();
    const startImportance = importanceValues[index];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const padding = 10;
      const usableHeight = graphHeight - padding * 2;

      // Calculate new Y position within SVG coordinate system
      let newYPosition = valueToYPosition(startImportance) + deltaY;

      // Constrain newYPosition within the graph's bounds
      newYPosition = Math.max(
        padding,
        Math.min(graphHeight - padding, newYPosition)
      );

      // Convert newYPosition back to importance value
      const newImportance = 1 - (newYPosition - padding) / usableHeight;
      handleDotDrag(index, newImportance);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      console.log("Drag ended!");
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function generateCurvePath(
    values: number[],
    spacing: number,
    height: number
  ) {
    if (values.length < 2) return "";

    const points = values.map((value, index) => ({
      x: index * spacing + spacing / 2 + xOffset,
      y: valueToYPosition(value),
    }));

    // Create smooth curve using lines
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      path += ` L ${current.x},${current.y}`;
    }
    return path;
  }

  function valueToYPosition(value: number) {
    const padding = 10; // Top and bottom padding
    const usableHeight = graphHeight - padding * 2;
    return padding + (1 - value) * usableHeight;
  }

  function renderYAxis() {
    const yAxisValues = [0, 0.25, 0.5, 0.75, 1]; // Define the y-axis labels
    return yAxisValues.map((value, index) => (
      <g key={index}>
        {/* Horizontal grid line */}
        <line
          x1={xOffset}
          y1={valueToYPosition(value)}
          x2={Math.max(containerWidth, totalWidth)}
          y2={valueToYPosition(value)}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
        {/* Y-axis label */}
        <text
          x={xOffset - 5} // Position label to the left of the grid line
          y={valueToYPosition(value) + 4} // Adjust for text height
          textAnchor="end"
          fontSize="10"
        >
          {value.toFixed(2)}
        </text>
      </g>
    ));
  }
};

export default ImportanceTab;

export function rgbToNumber(r: number, g: number, b: number) {
  return (r << 16) | (g << 8) | b;
}

export function numberToRgb(num: number) {
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return { r, g, b };
}

export function hexToRgb(hex: string) {
  // Remove the leading '#' if it's there
  hex = hex!.replace(/^#/, "");
  // Parse the r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    n = isNaN(n) ? 0 : Math.max(0, Math.min(255, Math.round(n)));
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

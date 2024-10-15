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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { globalRegulator } from "@/helpers/globals";

interface ImportanceTabProps {
  lyrics: string[][];
  onImportanceChange: (lineIndex: number, importanceValues: number[]) => void;
}

interface Customization {
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
}) => {
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [importanceValues, setImportanceValues] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [customizations, setCustomizations] = useState<Customization[]>([]); // Store customizations

  // Importance Curve ----------------
  // Initialize importance values when selected line changes
  useEffect(() => {
    const wordsInLine = lyrics[selectedLineIndex]?.length || 0;
    setImportanceValues(Array(wordsInLine).fill(0.5)); // Default importance 0.5
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

  // Handle dot dragging
  const handleDotDrag = (index: number, newImportance: number) => {
    const clampedImportance = Math.max(0, Math.min(1, newImportance));
    const updatedValues = [...importanceValues];
    updatedValues[index] = clampedImportance;
    setImportanceValues(updatedValues);
  };

  // Callback when dragging ends
  const handleDragEnd = () => {
    onImportanceChange(selectedLineIndex, importanceValues);
  };

  // Calculate dimensions
  const graphHeight = 200;
  const wordSpacing = 100; // Adjust as needed
  const totalWidth = (lyrics[selectedLineIndex]?.length || 0) * wordSpacing;

  // Left offset for y-axis labels
  const xOffset = 30;

  // Customizations ----------------

  useEffect(() => {
    customizations.forEach((customization) => {
      if (customization.type === "Enlarge by") {
        globalRegulator.impEnlargeFactor = customization.factor;
      } else if (customization.type === "Slow down animation by") {
        globalRegulator.impAnimSlowFactor = customization.factor;
      }
    });
    console.log("Customizations updated:", customizations);
  }, [customizations]);

  const addCustomization = (type: string) => {
    setCustomizations([...customizations, { type, factor: 1 }]); // Default factor of 1
  };

  const removeCustomization = (index: number) => {
    const updated = [...customizations];
    updated.splice(index, 1);
    setCustomizations(updated);
  };

  // Handle factor change
  const handleFactorChange = (index: number, factor: number) => {
    const updated = [...customizations];
    updated[index].factor = factor;
    setCustomizations(updated);
  };

  // UI for Customizations
  const renderCustomizations = () => (
    <Container>
      <Typography variant="h6">Define what importance means!</Typography>
      <Typography variant="body1">
        By changing the importance of a word from 0.5 to 1, I want the word
        to...
      </Typography>
      <Box mt={2}>
        {customizations.map((customization, index) => (
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
        ))}
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
      {/* Dropdown Menu */}
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
      handleDragEnd();
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

    // Create smooth curve using cubic Bezier curves
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const midX = (prev.x + current.x) / 2;
      path += ` Q ${midX},${prev.y} ${current.x},${current.y}`;
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

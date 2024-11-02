// LyricalInstrumentsTab.js

import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Slider,
  Select,
  MenuItem,
} from "@mui/material";

interface LyricalInstrumentsTabProps {
  onApply: (
    instrument: string,
    options: {
      emphasisScale: number;
      animationSpeed: number;
      alignment: string;
    }
  ) => void;
  onReset: () => void;
}

export default function LyricalInstrumentsTab({
  onApply,
  onReset,
}: LyricalInstrumentsTabProps) {
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [emphasisScale, setEmphasisScale] = useState(0.5);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [alignment, setAlignment] = useState("center");

  const handleInstrumentChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSelectedInstrument(event.target!.value);
  };

  const handleEmphasisScaleChange = (
    event: Event,
    value: number | number[],
    activeThumb: number
  ) => {
    if (typeof value === "number") setEmphasisScale(value);
    else {
      console.log(
        "[handleEmphasisScaleChange] Value is not a number, something wrong"
      );
    }
  };

  const handleAnimationSpeedChange = (
    event: Event,
    value: number | number[],
    activeThumb: number
  ) => {
    if (typeof value === "number") setAnimationSpeed(value);
    else {
      console.log(
        "[handleAnimationSpeedChange] Value is not a number, something wrong"
      );
    }
  };

  const handleAlignmentChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setAlignment(event.target.value);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* Instrument Selector */}
      <Typography variant="h6">
        Select Lyrical Instrument (Without Preview for now)
      </Typography>
      <Select
        value={selectedInstrument}
        onChange={handleInstrumentChange}
        fullWidth
      >
        <MenuItem value="spotlight">Spotlight</MenuItem>
        <MenuItem value="pulse">Pulse</MenuItem>
        <MenuItem value="cluster">Cluster</MenuItem>
        <MenuItem value="cascade">Cascade</MenuItem>
        <MenuItem value="frame">Frame</MenuItem>
      </Select>

      {/* Dynamic Control Section */}
      {selectedInstrument && (
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="body1">Adjust Parameters</Typography>

          {/* Emphasis Scale */}
          <Typography variant="body2">Emphasis Scale</Typography>
          <Slider
            value={emphasisScale}
            onChange={handleEmphasisScaleChange}
            min={0}
            max={1}
            step={0.01}
            aria-label="Emphasis Scale"
          />

          {/* Animation Speed */}
          <Typography variant="body2">Animation Speed</Typography>
          <Slider
            value={animationSpeed}
            onChange={handleAnimationSpeedChange}
            min={0.1}
            max={2}
            step={0.1}
            aria-label="Animation Speed"
          />

          {/* Alignment */}
          <Typography variant="body2">Alignment</Typography>
          <Select value={alignment} onChange={handleAlignmentChange} fullWidth>
            <MenuItem value="center">Center</MenuItem>
            <MenuItem value="left">Left</MenuItem>
            <MenuItem value="right">Right</MenuItem>
          </Select>
        </Box>
      )}

      {/* Preview Toggle */}
      <Button variant="outlined" onClick={() => console.log("Preview toggled")}>
        Toggle Preview
      </Button>

      {/* Apply and Reset Buttons */}
      <Box display="flex" justifyContent="space-between" marginTop={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() =>
            onApply(selectedInstrument, {
              emphasisScale,
              animationSpeed,
              alignment,
            })
          }
        >
          Apply
        </Button>
        <Button variant="outlined" color="secondary" onClick={onReset}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}

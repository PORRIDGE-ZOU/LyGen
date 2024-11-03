import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Slider,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  FormGroup,
} from "@mui/material";
import { InstrumentList } from "@/helpers/globals";

interface LyricalInstrumentsTabProps {
  onApply: (
    instrument: string,
    settings: InstrumentSettings,
    selectedLines: number[]
  ) => void;
  onReset: (instrument: string, selectedLines: number[]) => void;
  lineInstruments: { [key: number]: string };
  lyrics: string[][];
}

export interface InstrumentSettings {
  boldThreshold?: number;
  sizeScaleFactor?: number;
  animationSpeedFactor?: number;
}

export default function LyricalInstrumentsTab({
  onApply,
  onReset,
  lineInstruments,
  lyrics,
}: LyricalInstrumentsTabProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [settings, setSettings] = useState<InstrumentSettings>({
    boldThreshold: 0.5,
    sizeScaleFactor: 1,
    animationSpeedFactor: 1,
  });

  // Handle instrument selection from the left menu
  const handleInstrumentSelect = (instrumentValue: string) => {
    setSelectedInstrument(instrumentValue);
    // Reset selected lines when instrument changes
    setSelectedLines([]);
  };

  // Handle line selection checkboxes
  const handleLineToggle =
    (lineIndex: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        setSelectedLines([...selectedLines, lineIndex]);
      } else {
        setSelectedLines(selectedLines.filter((index) => index !== lineIndex));
      }
    };

  // Handle slider changes for instrument settings
  const handleSliderChange =
    (setting: keyof InstrumentSettings) =>
    (event: Event, value: number | number[]) => {
      setSettings({
        ...settings,
        [setting]: value as number,
      });
    };

  // Apply the selected instrument and settings to the selected lines
  const handleApply = () => {
    if (selectedInstrument && selectedLines.length > 0) {
      onApply(selectedInstrument, settings, selectedLines);
    }
  };

  // Reset the selected instrument settings for the selected lines
  const handleReset = () => {
    if (selectedInstrument && selectedLines.length > 0) {
      onReset(selectedInstrument, selectedLines);
    }
  };

  return (
    <Box display="flex" height="100%">
      {/* Left side with instruments list */}
      <Box width="30%" borderRight="1px solid #ccc">
        <List component="nav">
          {InstrumentList.map((instrument) => (
            <ListItem
              key={instrument.value}
              disablePadding
              selected={selectedInstrument === instrument.value}
            >
              <ListItemButton
                onClick={() => handleInstrumentSelect(instrument.value)}
              >
                <ListItemText primary={instrument.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Right side with customization panel */}
      <Box width="70%" padding="16px">
        {selectedInstrument ? (
          <>
            <Typography variant="h6">
              Configure{" "}
              {
                InstrumentList.find((inst) => inst.value === selectedInstrument)
                  ?.name
              }
            </Typography>

            {/* Dynamic Controls Based on Selected Instrument */}
            {selectedInstrument === "boldThreshold" && (
              <Box marginTop={2}>
                <Typography>Threshold Value</Typography>
                <Slider
                  value={settings.boldThreshold || 0.5}
                  onChange={handleSliderChange("boldThreshold")}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Box>
            )}

            {selectedInstrument === "sizeScaling" && (
              <Box marginTop={2}>
                <Typography>Scale Factor</Typography>
                <Slider
                  value={settings.sizeScaleFactor || 1}
                  onChange={handleSliderChange("sizeScaleFactor")}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </Box>
            )}

            {selectedInstrument === "animationSpeedScaling" && (
              <Box marginTop={2}>
                <Typography>Speed Factor</Typography>
                <Slider
                  value={settings.animationSpeedFactor || 1}
                  onChange={handleSliderChange("animationSpeedFactor")}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </Box>
            )}

            {/* Line Selection */}
            <Typography variant="h6" marginTop={4}>
              Select Lyric Lines to Apply
            </Typography>
            <FormGroup>
              {lyrics.map((line, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={selectedLines.includes(index)}
                      onChange={handleLineToggle(index)}
                    />
                  }
                  label={`${line.join(" ")}${
                    lineInstruments[index] === selectedInstrument
                      ? " (Already Applied)"
                      : ""
                  }`}
                />
              ))}
            </FormGroup>

            {/* Apply and Reset Buttons */}
            <Box display="flex" justifyContent="space-between" marginTop={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApply}
                disabled={selectedLines.length === 0}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleReset}
                disabled={selectedLines.length === 0}
              >
                Reset
              </Button>
            </Box>
          </>
        ) : (
          <Typography variant="h6">
            Select an Instrument to Configure
          </Typography>
        )}
      </Box>
    </Box>
  );
}

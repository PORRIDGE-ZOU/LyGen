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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  globalRegulator,
  InstrumentList,
  AnimationPresets,
} from "@/helpers/globals";

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
  selectedAnimation?: string;
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
    boldThreshold: globalRegulator.impBoldThreshold,
    sizeScaleFactor: globalRegulator.impEnlargeFactor,
    animationSpeedFactor: globalRegulator.impAnimSlowFactor,
    selectedAnimation: AnimationPresets[0], // New state for selected animation
  });
  const [selectedAnimation, setSelectedAnimation] = useState<string>("");

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

  const handleAnimationSelect = (event: { target: { value: string } }) => {
    setSettings({
      ...settings,
      selectedAnimation: event.target.value as string,
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
            <Typography variant="h5">
              Configure{" "}
              {
                InstrumentList.find((inst) => inst.value === selectedInstrument)
                  ?.name
              }
            </Typography>

            {/* Dynamic Controls Based on Selected Instrument */}
            {selectedInstrument === "boldThreshold" && (
              <Box marginTop={2}>
                <Typography variant="h6">
                  Bolden the word if its importance is larger than the
                  threshold.
                </Typography>
                <Typography>
                  Threshold Value: {settings.boldThreshold}
                </Typography>
                <Slider
                  value={
                    settings.boldThreshold || globalRegulator.impBoldThreshold
                  }
                  onChange={handleSliderChange("boldThreshold")}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Box>
            )}

            {selectedInstrument === "sizeScaling" && (
              <Box marginTop={2}>
                <Typography variant="h6">
                  Enlarge the word based on its importance, such that if the
                  importance is 1, the word will be enlarged by 100% * scale
                  factor.
                </Typography>
                <Typography>
                  Scale Factor: {settings.sizeScaleFactor}
                </Typography>
                <Slider
                  value={
                    settings.sizeScaleFactor || globalRegulator.impEnlargeFactor
                  }
                  onChange={handleSliderChange("sizeScaleFactor")}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </Box>
            )}

            {selectedInstrument === "animationSpeedScaling" && (
              <Box marginTop={2}>
                <Typography variant="h6">
                  Slow down the animation speed based on the importance of the
                  word, such that if the importance is 1, the word will be
                  animated at 100% * speed factor.
                </Typography>
                <Typography>
                  Speed Factor: {settings.animationSpeedFactor}
                </Typography>
                <Slider
                  value={
                    settings.animationSpeedFactor ||
                    globalRegulator.impAnimSlowFactor
                  }
                  onChange={handleSliderChange("animationSpeedFactor")}
                  min={0.1}
                  max={2}
                  step={0.01}
                />
              </Box>
            )}

            {/* Select Animation Dropdown */}
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel>Select Animation for this instrument</InputLabel>
              <Select
                value={settings.selectedAnimation || ""}
                onChange={handleAnimationSelect}
                label="Select Animation"
              >
                {AnimationPresets.map((animation) => (
                  <MenuItem key={animation} value={animation}>
                    {animation}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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

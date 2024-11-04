import React, { useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  globalRegulator,
  InstrumentList,
  AnimationPresets,
  DefaultInstrumentList,
} from "@/helpers/globals";

interface LyricalInstrumentsTabProps {
  onApply: (
    instrument: string,
    settings: InstrumentSettings,
    selectedLines: number[]
  ) => void;
  onReset: (instrument: string, selectedLines: number[]) => void;
  onChangeCustomInstruments: (instruments: CustomInstrument[]) => void;
  lineInstruments: { [key: number]: string };
  lyrics: string[][];
}

export interface InstrumentSettings {
  boldThreshold?: number;
  sizeScaleFactor?: number;
  animationSpeedFactor?: number;
  selectedAnimation?: string;
  functions?: InstrumentFunction[]; // JUST for custom instruments
}

export interface CustomInstrument {
  name: string;
  functions: InstrumentFunction[];
}

interface InstrumentFunction {
  type: string; // 'sizeScaling', 'boldThreshold', 'animationSpeedScaling'
  settings: any; // Settings specific to the function, will be in form of { 'boldThreshold': 0.5 }
}

export default function LyricalInstrumentsTab({
  onApply,
  onReset,
  onChangeCustomInstruments,
  lineInstruments,
  lyrics,
}: LyricalInstrumentsTabProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [settings, setSettings] = useState<InstrumentSettings>({
    boldThreshold: globalRegulator.impBoldThreshold,
    sizeScaleFactor: globalRegulator.impEnlargeFactor,
    animationSpeedFactor: globalRegulator.impAnimSlowFactor,
    selectedAnimation: AnimationPresets[0],
  });
  const [customInstruments, setCustomInstruments] = useState<
    CustomInstrument[]
  >(() => {
    // Retrieve saved custom instruments from localStorage when component mounts
    const savedInstruments = localStorage.getItem("customInstruments");
    return savedInstruments ? JSON.parse(savedInstruments) : [];
  });
  const [showCreateInstrument, setShowCreateInstrument] = useState(false);
  const [isEditingInstrument, setIsEditingInstrument] = useState(false);
  const [newInstrumentName, setNewInstrumentName] = useState("");
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [newInstrumentSettings, setNewInstrumentSettings] = useState<any>({});
  const [instrumentToEdit, setInstrumentToEdit] =
    useState<CustomInstrument | null>(null);

  useEffect(() => {
    onChangeCustomInstruments(customInstruments);
    // TODO: Will this work as expected? Like when I close page and open again, will it load the custom instruments? ACROSS the website, i mean, also to the other pages? -- GEORGE
    localStorage.setItem(
      "customInstruments",
      JSON.stringify(customInstruments)
    );
  }, [customInstruments, onChangeCustomInstruments]);

  // Handle instrument selection from the left menu
  const handleInstrumentSelect = (instrumentValue: string) => {
    setSelectedInstrument(instrumentValue);
    // Reset selected lines when instrument changes
    setSelectedLines([]);
    // Reset settings
    setSettings({});

    // Check if it's a custom instrument
    const customInstrument = customInstruments.find(
      (inst) => inst.name === instrumentValue
    );
    if (customInstrument) {
      // Set settings based on custom instrument functions
      let initialSettings: InstrumentSettings = {
        functions: customInstrument.functions,
      };
      customInstrument.functions.forEach((func) => {
        (initialSettings as any)[func.type] = func.settings; // to muffle TS error
      });
      setSettings(initialSettings);
    } else {
      // Handle predefined instruments
      // Set default settings based on the instrument
      if (instrumentValue === "boldThreshold") {
        setSettings({
          boldThreshold: globalRegulator.impBoldThreshold,
          selectedAnimation: AnimationPresets[0],
        });
      } else if (instrumentValue === "sizeScaling") {
        setSettings({
          sizeScaleFactor: globalRegulator.impEnlargeFactor,
          selectedAnimation: AnimationPresets[0],
        });
      } else if (instrumentValue === "animationSpeedScaling") {
        setSettings({
          animationSpeedFactor: globalRegulator.impAnimSlowFactor,
          selectedAnimation: AnimationPresets[0],
        });
      }
    }
  };

  const handleAddInstrument = () => {
    setIsEditingInstrument(false);
    setNewInstrumentName("");
    setSelectedFunctions([]);
    setNewInstrumentSettings({});
    setShowCreateInstrument(true);
  };

  const handleEditInstrument = (instrument: CustomInstrument) => {
    setIsEditingInstrument(true);
    setInstrumentToEdit(instrument);
    setNewInstrumentName(instrument.name);
    setSelectedFunctions(instrument.functions.map((func) => func.type));
    const settings = {} as any;
    instrument.functions.forEach((func) => {
      settings[func.type] = func.settings;
    });
    setNewInstrumentSettings(settings);
    setShowCreateInstrument(true);
  };

  const handleDeleteInstrument = (instrumentName: string) => {
    setCustomInstruments((prevInstruments) =>
      prevInstruments.filter((inst) => inst.name !== instrumentName)
    );
    if (selectedInstrument === instrumentName) {
      setSelectedInstrument("");
      setSettings({});
      setSelectedLines([]);
    }
  };

  const handleFunctionToggle = (funcValue: string) => {
    if (selectedFunctions.includes(funcValue)) {
      setSelectedFunctions(selectedFunctions.filter((f) => f !== funcValue));
      const newSettings = { ...newInstrumentSettings };
      delete newSettings[funcValue];
      setNewInstrumentSettings(newSettings);
    } else {
      setSelectedFunctions([...selectedFunctions, funcValue]);
    }
  };

  const handleCreateInstrument = () => {
    if (!newInstrumentName.trim()) {
      alert("Instrument name cannot be empty.");
      return;
    }

    // Check for duplicate names
    const duplicate = customInstruments.some(
      (inst) => inst.name === newInstrumentName && inst !== instrumentToEdit
    );
    if (duplicate) {
      alert("An instrument with this name already exists.");
      return;
    }

    const newInstrument: CustomInstrument = {
      name: newInstrumentName,
      functions: selectedFunctions.map((funcType) => ({
        type: funcType,
        settings: newInstrumentSettings[funcType],
      })),
    };

    if (isEditingInstrument && instrumentToEdit) {
      // Update existing instrument
      setCustomInstruments((prevInstruments) =>
        prevInstruments.map((inst) =>
          inst.name === instrumentToEdit.name ? newInstrument : inst
        )
      );
    } else {
      // Add new instrument
      let currentInstruments = [...customInstruments];
      currentInstruments.push(newInstrument);
      setCustomInstruments(currentInstruments);
    }

    setShowCreateInstrument(false);
    setNewInstrumentName("");
    setSelectedFunctions([]);
    setNewInstrumentSettings({});
    setInstrumentToEdit(null);
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
          {DefaultInstrumentList.map((instrument) => (
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

          {/* Custom Instruments */}
          {customInstruments.map((instrument, index) => (
            <ListItem
              key={`custom-${index}`}
              disablePadding
              selected={selectedInstrument === instrument.name}
              secondaryAction={
                <>
                  <Button
                    size="small"
                    onClick={() => handleEditInstrument(instrument)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleDeleteInstrument(instrument.name)}
                  >
                    Delete
                  </Button>
                </>
              }
            >
              <ListItemButton
                onClick={() => handleInstrumentSelect(instrument.name)}
              >
                <ListItemText primary={instrument.name} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Add Instrument Button */}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleAddInstrument}
            style={{ margin: "16px" }}
          >
            Add Instrument
          </Button>
        </List>
      </Box>

      {/* Add Instrument Dialog */}
      {showCreateInstrument && (
        <Dialog
          open={showCreateInstrument}
          onClose={() => setShowCreateInstrument(false)}
        >
          <DialogTitle>
            {isEditingInstrument ? "Edit Instrument" : "Create New Instrument"}
          </DialogTitle>
          <DialogContent>
            {/* Instrument Name */}
            <TextField
              label="Instrument Name"
              value={newInstrumentName}
              onChange={(e) => setNewInstrumentName(e.target.value)}
              fullWidth
              margin="dense"
            />

            {/* Function Selection */}
            <Typography variant="subtitle1" marginTop={2}>
              Select Functions:
            </Typography>
            <FormGroup>
              {DefaultInstrumentList.map((func) => (
                <FormControlLabel
                  key={func.value}
                  control={
                    <Checkbox
                      checked={selectedFunctions.includes(func.value)}
                      onChange={() => handleFunctionToggle(func.value)}
                    />
                  }
                  label={func.name}
                />
              ))}
            </FormGroup>

            {/* Customization Controls for Selected Functions */}
            {selectedFunctions.includes("sizeScaling") && (
              <Box marginTop={2}>
                <Typography>Size Scale Factor</Typography>
                <Slider
                  value={newInstrumentSettings.sizeScaling || 1}
                  onChange={(e, value) =>
                    setNewInstrumentSettings({
                      ...newInstrumentSettings,
                      sizeScaling: value as number,
                    })
                  }
                  min={1}
                  max={3}
                  step={0.1}
                />
              </Box>
            )}

            {selectedFunctions.includes("boldThreshold") && (
              <Box marginTop={2}>
                <Typography>Bold Threshold</Typography>
                <Slider
                  value={newInstrumentSettings.boldThreshold || 0.5}
                  onChange={(e, value) =>
                    setNewInstrumentSettings({
                      ...newInstrumentSettings,
                      boldThreshold: value as number,
                    })
                  }
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Box>
            )}

            {selectedFunctions.includes("animationSpeedScaling") && (
              <Box marginTop={2}>
                <Typography>Animation Speed Factor</Typography>
                <Slider
                  value={newInstrumentSettings.animationSpeedFactor || 1}
                  onChange={(e, value) =>
                    setNewInstrumentSettings({
                      ...newInstrumentSettings,
                      animationSpeedFactor: value as number,
                    })
                  }
                  min={0.1}
                  max={2}
                  step={0.01}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateInstrument(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInstrument}>
              {isEditingInstrument ? "Save Changes" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Right side with customization panel */}
      <Box width="70%" padding="16px">
        {selectedInstrument ? (
          <>
            <Typography variant="h5">
              Configure{" "}
              {InstrumentList.find((inst) => inst.value === selectedInstrument)
                ?.name || selectedInstrument}
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

            {/* Custom Instruments */}
            {customInstruments.find(
              (inst) => inst.name === selectedInstrument
            ) &&
              settings.functions?.map((func) => {
                if (func.type === "sizeScaling") {
                  return (
                    <Box marginTop={2} key="sizeScaling">
                      <Typography>Size Scale Factor</Typography>
                      <Slider
                        value={settings.sizeScaleFactor || 1}
                        onChange={handleSliderChange("sizeScaleFactor")}
                        min={1}
                        max={3}
                        step={0.1}
                      />
                    </Box>
                  );
                }
                if (func.type === "boldThreshold") {
                  return (
                    <Box marginTop={2} key="boldThreshold">
                      <Typography>Bold Threshold</Typography>
                      <Slider
                        value={settings.boldThreshold || 0.5}
                        onChange={handleSliderChange("boldThreshold")}
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </Box>
                  );
                }
                if (func.type === "animationSpeedScaling") {
                  return (
                    <Box marginTop={2} key="animationSpeedScaling">
                      <Typography>Animation Speed Factor</Typography>
                      <Slider
                        value={settings.animationSpeedFactor || 1}
                        onChange={handleSliderChange("animationSpeedFactor")}
                        min={0.1}
                        max={2}
                        step={0.01}
                      />
                    </Box>
                  );
                }
                return null;
              })}

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
              {/* <Button
                variant="outlined"
                color="secondary"
                onClick={handleReset}
                disabled={selectedLines.length === 0}
              >
                Reset
              </Button> */}
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

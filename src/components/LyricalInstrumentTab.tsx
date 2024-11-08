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
import ColorChangeCutpointsEditor from "./ColorChangeCutpointsEditor";

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
  customInstruments: CustomInstrument[];
  selectedInstrument: string;
  setSelectedInstrument: React.Dispatch<React.SetStateAction<string>>;
  instrumentSettings: { [instrument: string]: InstrumentSettings };
  setInstrumentSettings: React.Dispatch<
    React.SetStateAction<{ [instrument: string]: InstrumentSettings }>
  >;
}

/**
 * NOTE: the naming of InstrumentSettings is DIFFERENT from the Instrument Value naming.
 * "boldThreshold", "sizeScaleFactor", "animationSpeedFactor".
 */
export interface InstrumentSettings {
  boldThreshold?: number;
  sizeScaleFactor?: number;
  animationSpeedFactor?: number;
  selectedAnimation?: string;
  functions?: CustomFunction[]; // For custom instruments
  colorChangeCutpoints?: ColorChangeCutpoint[]; // New property
}

export interface ColorChangeCutpoint {
  threshold: number; // Importance threshold between 0 and 1
  color: string; // Color in hex format
}

export interface CustomInstrument {
  name: string;
  functions: CustomFunction[];
}

/**
 * This is used for custom instruments.
 * type: Type of the function, SHOULD FOLLOW THE Instrument Value naming
 * 'sizeScaling', 'boldThreshold', 'animationSpeedScaling'.
 * settings: Value of the function
 */
export interface CustomFunction {
  type: string;
  value: any; // Value of this type
}

export default function LyricalInstrumentsTab(
  props: LyricalInstrumentsTabProps
) {
  const {
    onApply,
    onReset,
    onChangeCustomInstruments,
    lineInstruments,
    lyrics,
    customInstruments,
    selectedInstrument,
    setSelectedInstrument,
    instrumentSettings,
    setInstrumentSettings,
  } = props;
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [settings, setSettings] = useState<InstrumentSettings>({
    boldThreshold: globalRegulator.impBoldThreshold,
    sizeScaleFactor: globalRegulator.impEnlargeFactor,
    animationSpeedFactor: globalRegulator.impAnimSlowFactor,
    colorChangeCutpoints: globalRegulator.impColorChange,
    selectedAnimation: AnimationPresets[0],
  });
  // const [customInstruments, setCustomInstruments] = useState<
  //   CustomInstrument[]
  // >(() => {
  //   // Retrieve saved custom instruments from localStorage when component mounts
  //   const savedInstruments = localStorage.getItem("customInstruments");
  //   return savedInstruments ? JSON.parse(savedInstruments) : [];
  // });
  const [showCreateInstrument, setShowCreateInstrument] = useState(false);
  const [isEditingInstrument, setIsEditingInstrument] = useState(false);
  const [newInstrumentName, setNewInstrumentName] = useState("");
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  /**
   * Instrument Settings, SHOULD FOLLOW The Instrument Value naming
   * 'sizeScaling', 'boldThreshold', 'animationSpeedScaling'
   */
  const [newInstrumentSettings, setNewInstrumentSettings] = useState<any>({});
  const [instrumentToEdit, setInstrumentToEdit] =
    useState<CustomInstrument | null>(null);
  const combinedInstrumentList = [
    ...DefaultInstrumentList,
    ...customInstruments,
  ];

  // useEffect(() => {
  //   onChangeCustomInstruments(customInstruments);
  //   // TODO: Will this work as expected? Like when I close page and open again, will it load the custom instruments? ACROSS the website, i mean, also to the other pages? -- GEORGE
  //   localStorage.setItem(
  //     "customInstruments",
  //     JSON.stringify(customInstruments)
  //   );
  // }, [customInstruments, onChangeCustomInstruments]);
  // Update settings when selectedInstrument changes
  useEffect(() => {
    setSettings(
      instrumentSettings[selectedInstrument] ||
        getDefaultSettings(selectedInstrument)
    );
  }, [selectedInstrument]);

  // Update instrumentSettings in WidgetPanel when settings change
  useEffect(() => {
    if (selectedInstrument) {
      setInstrumentSettings((prev) => ({
        ...prev,
        [selectedInstrument]: settings,
      }));
    }
  }, [settings, selectedInstrument]);

  const handleInstrumentSelect = (instrumentValue: string) => {
    setSelectedInstrument(instrumentValue);
    setSelectedLines([]);
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
      settings[func.type] = func.value;
    });
    setNewInstrumentSettings(settings);
    setShowCreateInstrument(true);
  };

  const handleDeleteInstrument = (instrumentName: string) => {
    let newInstruments = customInstruments.filter(
      (inst) => inst.name !== instrumentName
    );
    // setCustomInstruments((prevInstruments) =>
    //   prevInstruments.filter((inst) => inst.name !== instrumentName)
    // );
    onChangeCustomInstruments(newInstruments);
    if (selectedInstrument === instrumentName) {
      setSelectedInstrument("");
      // setSettings({});
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
      console.log("funcValue", funcValue);
      setSelectedFunctions([...selectedFunctions, funcValue]);
      const newSettings = { ...newInstrumentSettings };
      if (funcValue === "sizeScaling") {
        newSettings.sizeScaling = 1;
      } else if (funcValue === "boldThreshold") {
        newSettings.boldThreshold = 0.5;
      } else if (funcValue === "animationSpeedScaling") {
        newSettings.animationSpeedScaling = 1;
      }
      setNewInstrumentSettings(newSettings);
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
        value: newInstrumentSettings[funcType],
      })),
    };
    console.log("[handleCreateIns] selectedFunctions", selectedFunctions);
    console.log(
      "[handleCreateIns] newInstrumentSettings",
      newInstrumentSettings
    );

    if (isEditingInstrument && instrumentToEdit) {
      // Update existing instrument
      // setCustomInstruments((prevInstruments) =>
      //   prevInstruments.map((inst) =>
      //     inst.name === instrumentToEdit.name ? newInstrument : inst
      //   )
      // );
      let currentInstruments = customInstruments.map((inst) =>
        inst.name === instrumentToEdit.name ? newInstrument : inst
      );
      onChangeCustomInstruments(currentInstruments);
    } else {
      // Add new instrument
      let currentInstruments = [...customInstruments];
      currentInstruments.push(newInstrument);
      // setCustomInstruments(currentInstruments);
      onChangeCustomInstruments(currentInstruments);
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

      // check if it's a custom instrument
      if (customInstruments.find((inst) => inst.name === selectedInstrument)) {
        let custom = customInstruments.find(
          (inst) => inst.name === selectedInstrument
        );
        custom?.functions.forEach((func) => {
          if (func.type === "boldThreshold" && setting === "boldThreshold") {
            func.value = value as number;
          } else if (
            func.type === "sizeScaling" &&
            setting === "sizeScaleFactor"
          ) {
            func.value = value as number;
          } else if (
            func.type === "animationSpeedScaling" &&
            setting === "animationSpeedFactor"
          ) {
            func.value = value as number;
          }
        });
      }
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
          {combinedInstrumentList.map((instrument, index) => (
            <ListItem
              key={"value" in instrument ? instrument.value : instrument.name}
              disablePadding
              selected={
                selectedInstrument ===
                ("value" in instrument ? instrument.value : instrument.name)
              }
              secondaryAction={
                !DefaultInstrumentList.find(
                  (item) =>
                    "value" in instrument && item.value === instrument.value
                ) && (
                  <>
                    <Button
                      size="small"
                      onClick={() =>
                        handleEditInstrument(instrument as CustomInstrument)
                      }
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
                )
              }
            >
              <ListItemButton
                onClick={() =>
                  handleInstrumentSelect(
                    "value" in instrument ? instrument.value : instrument.name
                  )
                }
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
                  onChange={(e, value) => {
                    setNewInstrumentSettings({
                      ...newInstrumentSettings,
                      boldThreshold: value as number,
                    });
                  }}
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
                  value={newInstrumentSettings.animationSpeedScaling || 1}
                  onChange={(e, value) =>
                    setNewInstrumentSettings({
                      ...newInstrumentSettings,
                      animationSpeedScaling: value as number,
                    })
                  }
                  min={0.1}
                  max={2}
                  step={0.01}
                />
              </Box>
            )}

            {selectedFunctions.includes("colorChange") && (
              <Box marginTop={2}>
                <Typography>Define Color Change Cutpoints</Typography>
                <ColorChangeCutpointsEditor
                  cutpoints={newInstrumentSettings.colorChangeCutpoints || []}
                  onCutpointsChange={(newCutpoints) => {
                    setNewInstrumentSettings({
                      ...newInstrumentSettings,
                      colorChangeCutpoints: newCutpoints,
                    });
                  }}
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
                  Speed up the animation speed based on the importance of the
                  word, such that if the importance is 1, the word will be
                  animated at original speed * speed factor.
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

            {selectedInstrument === "colorChange" && (
              <Box marginTop={2}>
                <Typography variant="h6">
                  Change text color based on importance thresholds.
                </Typography>
                <ColorChangeCutpointsEditor
                  cutpoints={
                    settings.colorChangeCutpoints ||
                    globalRegulator.impColorChange
                  }
                  onCutpointsChange={(newCutpoints) => {
                    setSettings({
                      ...settings,
                      colorChangeCutpoints: newCutpoints,
                    });
                  }}
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
                        value={
                          settings.sizeScaleFactor ||
                          globalRegulator.impEnlargeFactor
                        }
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
                        value={
                          settings.boldThreshold ||
                          globalRegulator.impBoldThreshold
                        }
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
                  );
                }
                if (func.type === "colorChange") {
                  return (
                    <Box marginTop={2} key="colorChange">
                      <Typography>Define Color Change Cutpoints</Typography>
                      <ColorChangeCutpointsEditor
                        cutpoints={
                          settings.colorChangeCutpoints ||
                          globalRegulator.impColorChange
                        }
                        onCutpointsChange={(newCutpoints) => {
                          applyCustomColorChange(newCutpoints);
                        }}
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

  function applyCustomColorChange(newCutpoints: ColorChangeCutpoint[]) {
    const sortedCutpoints = [...newCutpoints].sort(
      (a, b) => a.threshold - b.threshold
    );
    setSettings({
      ...settings,
      colorChangeCutpoints: sortedCutpoints,
    });
    let custom = customInstruments.find(
      (inst) => inst.name === selectedInstrument
    );
    if (custom) {
      custom.functions.forEach((func) => {
        if (func.type === "colorChange") {
          func.value = sortedCutpoints;
        }
      });
    }
  }

  function getDefaultSettings(instrumentValue: string): InstrumentSettings {
    if (instrumentValue === "boldThreshold") {
      return {
        boldThreshold: globalRegulator.impBoldThreshold,
        selectedAnimation: AnimationPresets[0],
      };
    } else if (instrumentValue === "sizeScaling") {
      return {
        sizeScaleFactor: globalRegulator.impEnlargeFactor,
        selectedAnimation: AnimationPresets[0],
      };
    } else if (instrumentValue === "animationSpeedScaling") {
      return {
        animationSpeedFactor: globalRegulator.impAnimSlowFactor,
        selectedAnimation: AnimationPresets[0],
      };
    } else if (instrumentValue === "colorChange") {
      return {
        colorChangeCutpoints: globalRegulator.impColorChange || [],
        selectedAnimation: AnimationPresets[0],
      };
    }
    // Default settings for custom instruments
    const customInstrument = customInstruments.find(
      (inst) => inst.name === instrumentValue
    );
    if (customInstrument) {
      let initialSettings: InstrumentSettings = {
        functions: customInstrument.functions,
      };
      customInstrument.functions.forEach((func) => {
        if (func.type === "sizeScaling") {
          initialSettings.sizeScaleFactor = func.value;
        } else if (func.type === "boldThreshold") {
          initialSettings.boldThreshold = func.value;
        } else if (func.type === "animationSpeedScaling") {
          initialSettings.animationSpeedFactor = func.value;
        } else if (func.type === "colorChange") {
          initialSettings.colorChangeCutpoints = func.value;
        }
      });
      return initialSettings;
    }
    return {};
  }
}

import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import ImportanceTab from "./ImportanceTab"; // Import the new component
import {
  DefaultInstrumentList,
  globalRegulator,
  InstrumentList,
} from "@/helpers/globals";
import { getLineFromIndex } from "@/helpers/misc";
import LyricalInstrumentsTab, {
  CustomInstrument,
  InstrumentSettings,
} from "./LyricalInstrumentTab";

interface WidgetPanelProps {
  currentLyrics: string[][];
  reAnimate: () => void;
}

export default function WidgetPanel({
  currentLyrics,
  reAnimate,
}: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [instrumentSettings, setInstrumentSettings] = useState<{
    [instrument: string]: InstrumentSettings;
  }>({});
  const [lineInstruments, setLineInstruments] = useState<{
    [key: number]: string;
  }>({});
  const [lineImportance, setLineImportance] = useState<{
    [key: number]: number[];
  }>({});
  const [customInstruments, setCustomInstruments] = useState<
    CustomInstrument[]
  >([]);

  const lyricsAvailable =
    currentLyrics && currentLyrics.length > 0 && currentLyrics[0].length;
  if (!lyricsAvailable) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <Typography variant="h4">Please Upload Lyrics</Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleLyricsLineSelect = (lineIndex: number) => {
    let line = getLineFromIndex(lineIndex);
    if (line === undefined) {
      return;
    }
    let lastText = line[line.length - 1];
    // NOTE: Recall that now starttime is the time that the text FINISHES its animation. --GEORGE
    let seekTime = lastText.textFabricObject!.get("starttime");
    console.log("last text:", lastText.text);
    console.log("seek time:", seekTime);
    globalRegulator.setCurrentTime(seekTime);
    reAnimate();
  };

  // NOTE: The function below will be called at various unexpected times, since it has multiple dependencies. --GEORGE
  const handleImportanceChange = (
    lineIndex: number,
    importanceValues: number[]
  ) => {
    setLineImportance((prev) => ({
      ...prev,
      [lineIndex]: importanceValues,
    }));

    let changedLine = getLineFromIndex(lineIndex);
    if (!changedLine) {
      console.warn(
        `[handleImpChange] Line ${lineIndex} not found in the active lyrics map.`
      );
      return;
    }
    if (importanceValues.length !== changedLine.length) {
      console.warn(
        `[handleImpChange] Importance values length (${importanceValues.length}) does not match changed line length (${changedLine.length}) for line ${lineIndex}.`
      );
      return; // Or handle the discrepancy as needed
    }
    changedLine.forEach((animatedText, index) => {
      const importanceValue = importanceValues[index];
      if (typeof importanceValue === "number") {
        animatedText.applyImportance(importanceValue);
      } else {
        console.error(`Importance value at index ${index} is not a number.`);
      }
    });
    reAnimate();
  };

  const handleWordCloudChange = (
    lineIndex: number,
    layout: {
      word: string;
      x: number;
      y: number;
      size: number;
      rotate: number;
    }[]
  ) => {
    let changedLine = getLineFromIndex(lineIndex);
    if (!changedLine) {
      console.warn(
        `[handleWordCloudChange] Line ${lineIndex} not found in the active lyrics map.`
      );
      return;
    }
    changedLine.forEach((animatedText, index) => {
      animatedText.textFabricObject!.set({
        left: layout[index].x,
        top: layout[index].y,
        fontSize: layout[index].size,
        angle: layout[index].rotate,
      });
    });
  };

  const handleInstrumentChange = (lineIndex: number, instrument: string) => {
    setLineInstruments((prev) => ({
      ...prev,
      [lineIndex]: instrument,
    }));
    // apply the instrument to the line
    let changedLine = getLineFromIndex(lineIndex);
    if (!changedLine) {
      console.warn(
        `[handleInstrumentChange] Line ${lineIndex} not found in the active lyrics map.`
      );
      return;
    }
    changedLine.forEach((animatedText) => {
      // see if instrument is custom
      const customInstrument = customInstruments.find(
        (item) => item.name === instrument
      );
      animatedText.applyInstrument(instrument, customInstrument);
    });
  };

  const handleLyricalInstrumentApply = (
    instrument: string,
    settings: InstrumentSettings,
    selectedLines: number[]
  ) => {
    // Combine default and custom instruments
    const allInstruments = [...InstrumentList];

    if (!allInstruments.find((item) => item.value === instrument)) {
      console.warn(
        `[handleLyricalInstrumentApply] Instrument ${instrument} not found in the instrument list.`
      );
      return;
    }

    // Update the instrument settings
    setInstrumentSettings((prevSettings) => ({
      ...prevSettings,
      [instrument]: settings,
    }));

    // Update lineInstruments
    setLineInstruments((prevLineInstruments) => {
      const updatedLineInstruments = { ...prevLineInstruments };
      selectedLines.forEach((lineIndex) => {
        updatedLineInstruments[lineIndex] = instrument;
      });
      return updatedLineInstruments;
    });

    // Apply the instrument logic based on the selected instrument
    if (
      instrument === "boldThreshold" &&
      settings.boldThreshold !== undefined
    ) {
      // Apply bold threshold logic
      globalRegulator.impBoldThreshold = settings.boldThreshold;
    }
    if (
      instrument === "sizeScaling" &&
      settings.sizeScaleFactor !== undefined
    ) {
      // Apply size scaling logic
      globalRegulator.impEnlargeFactor = settings.sizeScaleFactor;
    }
    if (
      instrument === "animationSpeedScaling" &&
      settings.animationSpeedFactor !== undefined
    ) {
      // Apply animation speed scaling logic
      globalRegulator.impAnimSlowFactor = settings.animationSpeedFactor;
    }
    if (
      instrument === "colorChange" &&
      settings.colorChangeCutpoints !== undefined
    ) {
      globalRegulator.impColorChange = settings.colorChangeCutpoints;
    }
    // Code below HAS NO USE! See TODO.txt for more info. --GEORGE
    // let customFunctions = settings.functions;
    // // Apply custom functions
    // if (customFunctions) {
    //   customFunctions.forEach((customFunction) => {
    //     console.log("Found custom function:", customFunction);
    //     // Apply custom function logic
    //     if (customFunction.type === "boldThreshold") {
    //       globalRegulator.impBoldThreshold = customFunction.value as number;
    //     }
    //     if (customFunction.type === "sizeScaling") {
    //       globalRegulator.impEnlargeFactor = customFunction.value as number;
    //     }
    //     if (customFunction.type === "animationSpeedScaling") {
    //       globalRegulator.impAnimSlowFactor = customFunction.value as number;
    //     }
    //     if (customFunction.type === "colorChange") {
    //       // TODO: Apply color change logic
    //       // You can access customFunction.value.colorChangeCutpoints here
    //       globalRegulator.impColorChange =
    //         customFunction.value.colorChangeCutpoints;
    //     }
    //   });
    // }

    // Apply the settings to the selected lines
    selectedLines.forEach((lineIndex) => {
      const line = getLineFromIndex(lineIndex);
      if (line) {
        // Apply the selected animation if it exists
        if (settings.selectedAnimation !== undefined) {
          handleAnimationChange(lineIndex, settings.selectedAnimation);
        }
        line.forEach((animatedText) => {
          // Refresh the animated text to apply changes
          const customInstrument = customInstruments.find(
            (item) => item.name === instrument
          );
          animatedText.applyInstrument(instrument, customInstrument);
        });
      }
    });

    reAnimate();
  };

  const handleLyricalInstrumentReset = (
    instrument: string,
    selectedLines: number[]
  ) => {
    // BASICALLY DOING NOTHING RN Because I haven't figured out what this is.
    // Remove instrument from lineInstruments
    // setLineInstruments((prevLineInstruments) => {
    //   const updatedLineInstruments = { ...prevLineInstruments };
    //   selectedLines.forEach((lineIndex) => {
    //     if (updatedLineInstruments[lineIndex] === instrument) {
    //       delete updatedLineInstruments[lineIndex];
    //     }
    //   });
    //   return updatedLineInstruments;
    // });

    // Reset properties on animated texts
    selectedLines.forEach((lineIndex) => {
      const line = getLineFromIndex(lineIndex);
      if (line) {
        line.forEach((animatedText) => {
          // Reset properties based on instrument
          if (instrument === "boldThreshold") {
          }
          if (instrument === "sizeScaling") {
          }
          if (instrument === "animationSpeedScaling") {
          }
          // animatedText.refresh();
        });
      }
    });

    // reAnimate();
  };

  const handleAnimationChange = (lineIndex: number, animation: string) => {
    let changedLine = getLineFromIndex(lineIndex);
    if (!changedLine) {
      console.warn(
        `[handleAnimationChange] Line ${lineIndex} not found in the active lyrics map.`
      );
      return;
    }
    changedLine.forEach((animatedText) => {
      animatedText.props.preset = animation;
    });
    console.log(
      "[handleAnimationChange] changed index",
      lineIndex,
      " to:",
      animation
    );
  };

  const handleCustomInstrumentChange = (instruments: CustomInstrument[]) => {
    console.log("[handleCustomInstrumentChange] instruments", instruments);
    setCustomInstruments(instruments);
    // Add missing instruments
    for (let i = 0; i < instruments.length; i++) {
      let instrument = instruments[i];
      if (
        InstrumentList.find((item) => item.value === instrument.name) ===
        undefined
      ) {
        InstrumentList.push({
          name: instrument.name,
          value: instrument.name,
        });
      }
    }
    // Remove instruments that are not in the list
    InstrumentList.forEach((item, index) => {
      if (DefaultInstrumentList.find((item) => item.value === item.value)) {
        return;
      }
      if (
        instruments.find((instrument) => instrument.name === item.value) ===
        undefined
      ) {
        InstrumentList.splice(index, 1);
      }
    });
  };

  return (
    <Box display="flex" height="100%">
      {/* Left side with Tabs */}
      <Box display="flex" flexDirection="column" width="15%" bgcolor="#f0f0f0">
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          <Tab label="Importance Curve" />
          <Tab label="Lyrical Instruments" />
          <Tab label="Images" />
          <Tab label="Animated Backgrounds" />
        </Tabs>
      </Box>

      {/* Right side with the content */}
      <Box
        width="85%"
        bgcolor="#f9f2ff"
        padding="16px"
        sx={{
          height: "100%", // Ensure it takes the full height of the parent
          overflowY: "auto", // Enable vertical scrolling
        }}
      >
        {activeTab === 0 && (
          <ImportanceTab
            lyrics={currentLyrics}
            onLyricsLineSelect={handleLyricsLineSelect}
            onImportanceChange={handleImportanceChange}
            onInstrumentChange={handleInstrumentChange}
            lineInstruments={lineInstruments}
            lineImportance={lineImportance}
          />
        )}
        {activeTab === 1 && (
          <LyricalInstrumentsTab
            onApply={handleLyricalInstrumentApply}
            onReset={handleLyricalInstrumentReset}
            onChangeCustomInstruments={handleCustomInstrumentChange}
            lineInstruments={lineInstruments}
            lyrics={currentLyrics}
            customInstruments={customInstruments}
            selectedInstrument={selectedInstrument}
            setSelectedInstrument={setSelectedInstrument}
            instrumentSettings={instrumentSettings}
            setInstrumentSettings={setInstrumentSettings}
          />
        )}
        {activeTab === 2 && (
          <Typography variant="h6">Images Content</Typography>
        )}
        {activeTab === 3 && (
          <Typography variant="h6">Animated Backgrounds Content</Typography>
        )}
      </Box>
    </Box>
  );
}

//const handleCustomizationChange = (customizations: Customization[]) => {
//   customizations.forEach((customization) => {
//     if (customization.type === "Enlarge by") {
//       console.log("[handleCustChange] Enlarge by", customization.factor);
//       globalRegulator.impEnlargeFactor = customization.factor;
//     } else if (customization.type === "Slow down animation by") {
//       console.log("[handleCustChange] Slow down by", customization.factor);
//       globalRegulator.impAnimSlowFactor = customization.factor;
//     } else if (customization.type === "Shift color") {
//       console.log("[handleCustChange] Shift color by", customization.factor);
//       let decode = numberToRgb(customization.factor);
//       globalRegulator.impRGBColor = [decode.r, decode.g, decode.b];
//     }
//   });

//   // refresh ALL animated texts
//   AllLyrics.forEach((line) => {
//     line.forEach((animatedText) => {
//       animatedText.refresh();
//     });
//   });

//   reAnimate();
// };

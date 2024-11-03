import React, { useCallback, useState } from "react";
import { Box, SelectChangeEvent, Tab, Tabs, Typography } from "@mui/material";
import ImportanceTab, { Customization } from "./ImportanceTab"; // Import the new component
import { activeLyrics, globalRegulator } from "@/helpers/globals";
import { getLineFromIndex, numberToRgb } from "@/helpers/misc";
import LyricalInstrumentsTab, {
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
  const [lineInstruments, setLineInstruments] = useState<{
    [key: number]: string;
  }>({});
  const [instrumentSettings, setInstrumentSettings] =
    useState<InstrumentSettings>({});
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
        animatedText.setImportance(importanceValue);
      } else {
        console.error(`Importance value at index ${index} is not a number.`);
      }
    });
    reAnimate();
  };

  const handleCustomizationChange = (customizations: Customization[]) => {
    customizations.forEach((customization) => {
      if (customization.type === "Enlarge by") {
        console.log("[handleCustChange] Enlarge by", customization.factor);
        globalRegulator.impEnlargeFactor = customization.factor;
      } else if (customization.type === "Slow down animation by") {
        console.log("[handleCustChange] Slow down by", customization.factor);
        globalRegulator.impAnimSlowFactor = customization.factor;
      } else if (customization.type === "Shift color") {
        console.log("[handleCustChange] Shift color by", customization.factor);
        let decode = numberToRgb(customization.factor);
        globalRegulator.impRGBColor = [decode.r, decode.g, decode.b];
      }
    });

    // refresh ALL animated texts
    activeLyrics.forEach((line) => {
      line.forEach((animatedText) => {
        animatedText.refresh();
      });
    });

    reAnimate();
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
  };

  const handleLyricalInstrumentApply = (
    instrument: string,
    settings: InstrumentSettings,
    selectedLines: number[]
  ) => {
    // Update instrument settings
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

    // Apply the settings to the lines that have the instrument assigned
    Object.keys(lineInstruments).forEach((lineIndexStr) => {
      const lineIndex = parseInt(lineIndexStr, 10);
      const instrument = lineInstruments[lineIndex];
      const line = getLineFromIndex(lineIndex);

      // if (line && instrument) {
      //   line.forEach((animatedText) => {
      //     // Apply the settings based on the selected instrument
      //     if (
      //       instrument === "boldThreshold" &&
      //       settings.boldThreshold !== undefined
      //     ) {
      //       // Apply bold threshold logic
      //       if (animatedText.importance >= settings.boldThreshold) {
      //         animatedText.textFabricObject!.fontWeight = "bold";
      //       } else {
      //         animatedText.textFabricObject!.fontWeight = "normal";
      //       }
      //     }

      //     if (
      //       instrument === "sizeScaling" &&
      //       settings.sizeScaleFactor !== undefined
      //     ) {
      //       // Apply size scaling logic
      //       const scaleFactor =
      //         1 + animatedText.importance * (settings.sizeScaleFactor - 1);
      //       animatedText.props.defaultScaleX = scaleFactor;
      //       animatedText.props.defaultScaleY = scaleFactor;
      //     }

      //     if (
      //       instrument === "animationSpeed" &&
      //       settings.animationSpeedFactor !== undefined
      //     ) {
      //       // Apply animation speed scaling logic
      //       animatedText.duration =
      //         animatedText.duration *
      //         (1 +
      //           animatedText.importance * (settings.animationSpeedFactor - 1));
      //     }

      //     // Refresh the animated text to apply changes
      //     animatedText.refresh();
      //   });
      // }
    });

    reAnimate();
  };

  const handleLyricalInstrumentReset = () => {};

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
            lineInstruments={lineInstruments} // Pass the assigned instruments
          />
        )}
        {activeTab === 1 && (
          <LyricalInstrumentsTab
            onApply={handleLyricalInstrumentApply}
            onReset={handleLyricalInstrumentReset}
            lineInstruments={lineInstruments}
            lyrics={currentLyrics}
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

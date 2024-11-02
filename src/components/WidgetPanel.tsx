import React, { useCallback, useState } from "react";
import { Box, SelectChangeEvent, Tab, Tabs, Typography } from "@mui/material";
import ImportanceTab, { Customization } from "./ImportanceTab"; // Import the new component
import { activeLyrics, globalRegulator } from "@/helpers/globals";
import { getLineFromIndex, numberToRgb } from "@/helpers/misc";
import LyricalInstrumentsTab from "./LyricalInstrumentTab";

interface WidgetPanelProps {
  currentLyrics: string[][];
  reAnimate: () => void;
}

export default function WidgetPanel({
  currentLyrics,
  reAnimate,
}: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
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
        <Typography variant="h4">No lyrics available</Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleLyricsLineSelect = (lineIndex: number) => {
    let keys = Array.from(activeLyrics.keys());
    let changedKey = keys[lineIndex];
    let seekTime = changedKey - 2;
    let line = getLineFromIndex(lineIndex);
    if (line === undefined) {
      return;
    }
    let lastText = line![line!.length - 1];
    seekTime -= lastText.duration;
    console.log("last text:", lastText.text);
    console.log("seek time:", seekTime);
    globalRegulator.setCurrentTime(seekTime);
    reAnimate();
  };

  // NOTE: The function below will be called at various unexpected times, since it has multiple dependencies. --GEORGE
  // const handleImportanceChange = useCallback(
  //   (lineIndex: number, importanceValues: number[]) => {
  //     // TODO: Handle the updated importance values here
  //     let keys = Array.from(activeLyrics.keys());
  //     let changedKey = keys[lineIndex];
  //     let changedLine = activeLyrics.get(changedKey);
  //     if (!changedLine) {
  //       console.warn(
  //         `[handleImpChange] Line ${lineIndex} not found in the active lyrics map.`
  //       );
  //       return;
  //     }
  //     changedLine.forEach((animatedText, index) => {
  //       animatedText.setImportance(importanceValues[index]);
  //     });

  //     setTimeout(() => {
  //       reAnimate();
  //     }, 0);
  //   },
  //   [reAnimate] // Add any variables from outside the function here
  // );
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
        defaultLeft: layout[index].x,
        defaultTop: layout[index].y,
      });
    });
  };

  const handleLyricalInstrumentApply = (
    instrument: string,
    options: {
      emphasisScale: number;
      animationSpeed: number;
      alignment: string;
    }
  ) => {};

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
            onCustomizationChange={handleCustomizationChange}
            onAnimationChange={handleAnimationChange}
            onWordCloudLayoutComplete={handleWordCloudChange}
          />
        )}
        {activeTab === 1 && (
          <LyricalInstrumentsTab
            onApply={handleLyricalInstrumentApply}
            onReset={handleLyricalInstrumentReset}
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

import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import ImportanceTab, { Customization } from "./ImportanceTab"; // Import the new component
import { activeLyrics, globalRegulator } from "@/helpers/globals";
import { numberToRgb } from "@/helpers/misc";

interface WidgetPanelProps {
  currentLyrics: string[][];
}

export default function WidgetPanel({ currentLyrics }: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleImportanceChange = (
    lineIndex: number,
    importanceValues: number[]
  ) => {
    // TODO: Handle the updated importance values here
    let keys = Array.from(activeLyrics.keys());
    let changedKey = keys[lineIndex];
    let changedLine = activeLyrics.get(changedKey);
    if (!changedLine) {
      console.warn(
        `[handleImpChange] Line ${lineIndex} not found in the active lyrics map.`
      );
      return;
    }
    changedLine.forEach((animatedText, index) => {
      animatedText.setImportance(importanceValues[index]);
    });
    console.log(`Importance values for line ${lineIndex}:`, importanceValues);
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
  };

  const handleAnimationChange = (lineIndex: number, animation: string) => {
    let keys = Array.from(activeLyrics.keys());
    let changedKey = keys[lineIndex];
    let changedLine = activeLyrics.get(changedKey);
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
    let keys = Array.from(activeLyrics.keys());
    let changedKey = keys[lineIndex];
    let changedLine = activeLyrics.get(changedKey);
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
          <Tab label="Lyric Importance" />
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
            onImportanceChange={handleImportanceChange}
            onCustomizationChange={handleCustomizationChange}
            onAnimationChange={handleAnimationChange}
            onWordCloudLayoutComplete={handleWordCloudChange}
          />
        )}
        {activeTab === 1 && (
          <Typography variant="h6">Images Content</Typography>
        )}
        {activeTab === 2 && (
          <Typography variant="h6">Animated Backgrounds Content</Typography>
        )}
      </Box>
    </Box>
  );
}

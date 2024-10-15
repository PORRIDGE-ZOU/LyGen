import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import ImportanceTab from "./ImportanceTab"; // Import the new component
import { activeLyrics } from "@/helpers/globals";

interface WidgetPanelProps {
  currentLyrics: string[][];
}

export default function WidgetPanel({ currentLyrics }: WidgetPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
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
      console.error(`Line ${lineIndex} not found in the active lyrics map.`);
      return;
    }
    changedLine.forEach((animatedText, index) => {
      animatedText.setImportance(importanceValues[index]);
    });
    console.log(`Importance values for line ${lineIndex}:`, importanceValues);
  };

  return (
    <Box display="flex" height="100%">
      {/* Left side with Tabs */}
      <Box display="flex" flexDirection="column" width="15%" bgcolor="#f0f0f0">
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleChange}
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

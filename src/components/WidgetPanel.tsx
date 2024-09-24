import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import LyricImportanceCurve from "./LyricImportanceCurve"; // Import the new component

export default function WidgetPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Sample lyrics data
  const lyrics = [
    ["I", "got", "my", "driver's", "license", "last", "week"],
    ["Just", "like", "we", "always", "talked", "about"],
    // Add more lyric lines as needed
  ];

  const handleImportanceChange = (
    lineIndex: number,
    importanceValues: number[]
  ) => {
    console.log(`Importance values for line ${lineIndex}:`, importanceValues);
    // Handle the updated importance values here
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
          <LyricImportanceCurve
            lyrics={lyrics}
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

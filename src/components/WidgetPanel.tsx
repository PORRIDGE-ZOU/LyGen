import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";

export default function WidgetPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box display="flex" height="100%">
      {/* Left side with Tabs */}
      <Box display="flex" flexDirection="column" width="15%" bgcolor="#f0f0f0">
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleChange}
          TabIndicatorProps={{ style: { display: "none" } }} // Hide the indicator if desired
        >
          <Tab label="Text Animations" />
          <Tab label="Images" />
          <Tab label="Animated Backgrounds" />
        </Tabs>
      </Box>

      {/* Right side with the content */}
      <Box width="85%" bgcolor="#f9f2ff" padding="16px">
        {activeTab === 0 && (
          <Typography variant="h6">Text Animations Content</Typography>
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

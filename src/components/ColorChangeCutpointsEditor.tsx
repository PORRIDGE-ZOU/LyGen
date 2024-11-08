// ColorChangeCutpointsEditor.tsx

import React, { useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  IconButton,
  Slider,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ColorPickerInput from "./ColorPickerInput";
import { ColorChangeCutpoint } from "./LyricalInstrumentTab";

interface ColorChangeCutpointsEditorProps {
  cutpoints: ColorChangeCutpoint[];
  onCutpointsChange: (newCutpoints: ColorChangeCutpoint[]) => void;
}

const ColorChangeCutpointsEditor: React.FC<ColorChangeCutpointsEditorProps> = ({
  cutpoints,
  onCutpointsChange,
}) => {
  const handleAddCutpoint = () => {
    const newCutpoints = [...cutpoints, { threshold: 0, color: "#ffffff" }];
    onCutpointsChange(newCutpoints);
  };

  const handleDeleteCutpoint = (index: number) => {
    const newCutpoints = cutpoints.filter((_, i) => i !== index);
    onCutpointsChange(newCutpoints);
  };

  const handleThresholdChange = (index: number, newThreshold: number) => {
    const newCutpoints = [...cutpoints];
    newCutpoints[index].threshold = newThreshold;
    onCutpointsChange(newCutpoints);
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newCutpoints = [...cutpoints];
    newCutpoints[index].color = newColor;
    onCutpointsChange(newCutpoints);
  };

  return (
    <Box>
      {cutpoints.map((cutpoint, index) => (
        <Box key={index} display="flex" alignItems="center" marginBottom={2}>
          <Typography>Importance ≥</Typography>
          <Slider
            value={cutpoint.threshold}
            onChange={(e, value) =>
              handleThresholdChange(index, value as number)
            }
            min={0}
            max={1}
            step={0.01}
            style={{ width: "150px", marginLeft: "16px", marginRight: "16px" }}
          />
          <Typography>{cutpoint.threshold.toFixed(2)}</Typography>
          <ColorPickerInput
            color={cutpoint.color}
            setColor={(color) => handleColorChange(index, color)}
            text={cutpoint.color}
            setText={(color) => handleColorChange(index, color)}
          />
          <IconButton
            onClick={() => handleDeleteCutpoint(index)}
            aria-label="delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button variant="outlined" onClick={handleAddCutpoint}>
        Add Cutpoint
      </Button>
    </Box>
  );
};

export default ColorChangeCutpointsEditor;

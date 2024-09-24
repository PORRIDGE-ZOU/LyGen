import { Container, Typography, TextField } from "@mui/material";
import React, { useState } from "react";
import ColorPickerInput from "./ColorPickerInput";

interface InfoPanelProps {
  activeXPos: number;
  activeYPos: number;
  onPositionChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    pos: string
  ) => void;
  color: string;
  onColorChange: (color: string) => void;
  text: string;
  onTextChange: (text: string) => void;
}

const InfoPanel = ({
  activeXPos,
  activeYPos,
  onPositionChange,
  color,
  onColorChange,
  text,
  onTextChange,
}: InfoPanelProps) => {
  return (
    <Container>
      <Typography variant="h6">Information</Typography>
      <TextField
        id="textXPos"
        label="XPos"
        type="number"
        value={activeXPos}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onPositionChange(event, "x");
        }}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <TextField
        id="textYPos"
        label="YPos"
        type="number"
        value={activeYPos}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onPositionChange(event, "y");
        }}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <ColorPickerInput
        color={color}
        setColor={onColorChange}
        text={text}
        setText={onTextChange}
      />
    </Container>
  );
};

export default InfoPanel;

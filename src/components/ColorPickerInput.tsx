import React, { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { ColorLens } from "@mui/icons-material";

interface ColorPickerInputProps {
  color: string;
  setColor: (color: string) => void;
  text: string;
  setText: (text: string) => void;
  placeholder?: string;
}

const ColorPickerInput = ({
  color,
  setColor,
  text,
  setText,
  placeholder = "Enter a hex color",
}: ColorPickerInputProps) => {
  const isValidHexColor = (color: string): boolean => {
    // Allow 3 or 6 character hex codes
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    setColor(newColor);
    setText(newColor);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setText(newText);
    if (isValidHexColor(newText)) {
      const fullHexColor =
        newText.length === 4
          ? `#${newText[1]}${newText[1]}${newText[2]}${newText[2]}${newText[3]}${newText[3]}`
          : newText;
      console.log(
        "[ColorPickerInput::handleTextChange] Valid color: " + fullHexColor
      );
      setColor(fullHexColor);
    }
  };

  return (
    <TextField
      value={text}
      onChange={handleTextChange}
      label={placeholder}
      variant="outlined"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              style={{
                border: "none",
                width: "24px",
                height: "24px",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                background: "none",
                outline: "none",
              }}
            />
            <IconButton
              style={{
                marginLeft: "8px",
                padding: 0,
                color: color,
              }}
              aria-label="color picker"
              onClick={() => {}}
            >
              <ColorLens />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default ColorPickerInput;

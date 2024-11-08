import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import React, { useState, useEffect } from "react";
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
  font: string;
  onFontChange: (font: string) => void;
}

const InfoPanel = ({
  activeXPos,
  activeYPos,
  onPositionChange,
  color,
  onColorChange,
  text,
  onTextChange,
  font,
  onFontChange,
}: InfoPanelProps) => {
  const [fonts, setFonts] = useState<{ family: string }[]>([]);

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyAlVMGXdwTOggCs4-U7SS4V5v92nhXrobA`
        );
        const data = await response.json();
        setFonts(data.items);
      } catch (error) {
        console.error("Error fetching fonts:", error);
      }
    };
    fetchFonts();
  }, []);

  const loadFont = (fontFamily: string) => {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
      / /g,
      "+"
    )}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  };

  const handleFontChange = (event: { target: { value: string } }) => {
    const selectedFont = event.target.value as string;
    onFontChange(selectedFont);
    loadFont(selectedFont);
  };

  return (
    <Container>
      <Typography variant="h6">Information</Typography>
      <TextField
        id="textXPos"
        label="X Position"
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
        label="Y Position"
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

      <FormControl fullWidth margin="normal">
        <InputLabel id="font-select-label">Font</InputLabel>
        <Select
          labelId="font-select-label"
          id="font-select"
          value={font}
          onChange={handleFontChange}
        >
          {fonts.map((font) => (
            <MenuItem key={font.family} value={font.family}>
              {font.family}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Container>
  );
};

export default InfoPanel;

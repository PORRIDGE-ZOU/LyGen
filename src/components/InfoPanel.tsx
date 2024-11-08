import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import React from "react";
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
  // Define a list of pre-installed font names
  const fonts = [
    { family: "Roboto" },
    { family: "Open Sans" },
    { family: "Lato" },
    { family: "Montserrat" },
    { family: "Oswald" },
    { family: "Source Sans Pro" },
  ];

  const handleFontChange = (event: { target: { value: string } }) => {
    const selectedFont = event.target.value as string;
    onFontChange(selectedFont);
  };

  return (
    <Container style={{ width: "240px" }}>
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

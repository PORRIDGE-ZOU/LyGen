import React, { useRef, useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

interface LyricsColumnProps {
  onLyricsChange: (lyrics: string[]) => void;
  lyrics: string;
  setLyrics: (lyrics: string) => void;
}

const LyricsColumn = ({
  onLyricsChange,
  lyrics,
  setLyrics,
}: LyricsColumnProps) => {
  // const [lyrics, setLyrics] = useState<string>(
  //   "See the sunset\nThe day is ending"
  // );

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLyrics(event.target.value);
  };

  const addInput = () => {
    const separatedLines = lyrics.split("\n");
    onLyricsChange(separatedLines);
    console.log(
      "[LyricsColumn] calling changeLyrics. lyrics: ",
      separatedLines
    );
  };

  return (
    <Box>
      <TextField
        label="Lyrics"
        variant="outlined"
        margin="normal"
        fullWidth
        multiline
        rows={6} // Adjust the number of rows as needed for a big input box
        onChange={handleInputChange}
        value={lyrics}
      />
      <Button variant="contained" color="primary" onClick={addInput}>
        Render
      </Button>
    </Box>
  );
};

export default LyricsColumn;

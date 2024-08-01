import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import LyricsIcon from "@mui/icons-material/Lyrics";

interface FileUploadButtonProps {
  onAudioUpload: (file: File) => void;
}

interface LyricsProps {
  onLyricsUpload: (file: File) => void;
}

const AudioUploadButton = ({ onAudioUpload }: FileUploadButtonProps) => {
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      onAudioUpload(file);
    }
  };

  return (
    <Box>
      <input
        accept="audio/*"
        style={{ display: "none" }}
        id="audio-upload"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="audio-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<AudiotrackIcon />}
        >
          {fileName || "Upload Audio"}
        </Button>
      </label>
    </Box>
  );
};

const TextUploadButton = ({ onLyricsUpload }: LyricsProps) => {
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      onLyricsUpload(file);
    }
  };

  return (
    <Box>
      <input
        accept=".lrc,.txt"
        style={{ display: "none" }}
        id="lyrics-upload"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="lyrics-upload">
        <Button variant="contained" component="span" startIcon={<LyricsIcon />}>
          {fileName || "Upload Lyrics"}
        </Button>
      </label>
    </Box>
  );
};

export { AudioUploadButton, TextUploadButton };

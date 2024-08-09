import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { AudioUploadButton, TextUploadButton } from "./FileUploader";

interface GeneralPanelProps {
  onPlayClick: () => void;
  onPauseClick: () => void;
  currentTime: number;
  videoDuration: number;
  onChangeVideoDuration: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUpload: (file: File) => void;
  onLyricsUpload: (file: File) => void;
  onSeekToTimeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GeneralPanel({
  onPlayClick,
  onPauseClick,
  currentTime,
  videoDuration,
  onChangeVideoDuration,
  onAudioUpload,
  onLyricsUpload,
  onSeekToTimeChange,
}: GeneralPanelProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      padding="8px"
    >
      {/* Upload Buttons */}
      <Box display="flex" marginBottom="8px" justifyContent="space-between">
        <AudioUploadButton onAudioUpload={onAudioUpload} />
        <TextUploadButton onLyricsUpload={onLyricsUpload} />
      </Box>

      {/* Play/Pause Buttons */}
      <Box display="flex" justifyContent="space-between" marginBottom="8px">
        <Button variant="contained" onClick={onPlayClick} fullWidth>
          Play
        </Button>
        <Button variant="contained" onClick={onPauseClick} fullWidth>
          Pause
        </Button>
      </Box>

      {/* Video Duration and Current Time */}
      <Box marginBottom="8px">
        <TextField
          id="video-duration"
          label="Video Duration (in ms)"
          type="number"
          fullWidth
          value={videoDuration}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={onChangeVideoDuration}
          margin="dense"
        />
        <Typography>Current Time: {currentTime}</Typography>
      </Box>

      {/* Seek to Time */}
      <Box marginBottom="8px">
        <TextField
          id="seek-to-time"
          label="Seek to Time (in ms)"
          type="number"
          fullWidth
          value={currentTime}
          onChange={onSeekToTimeChange}
          InputLabelProps={{
            shrink: true,
          }}
          margin="dense"
        />
      </Box>
    </Box>
  );
}

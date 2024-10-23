import React from "react";
import { Box, Button, TextField, Typography, Slider } from "@mui/material";
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
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const targetValue = Array.isArray(newValue) ? newValue[0] : newValue;
    const syntheticEvent = {
      target: {
        value: targetValue.toString(),
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onSeekToTimeChange(syntheticEvent);
  };

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

      {/* Current Time Slider */}
      <Box marginBottom="8px" display="flex" alignItems="center">
        <Slider
          value={currentTime}
          min={0}
          max={videoDuration}
          onChange={handleSliderChange}
          style={{ marginLeft: "8px" }}
        />
      </Box>

      {/* Seek to Time */}
      <Box marginBottom="8px" display="flex" alignItems="center">
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

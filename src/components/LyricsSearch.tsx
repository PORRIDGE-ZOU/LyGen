import { useState } from "react";
import { TextField, Button } from "@mui/material";

interface LyricSearchProps {
  onLyricsSearchSuccess: (lyrics: string) => void;
}

const LyricSearch = ({ onLyricsSearchSuccess }: LyricSearchProps) => {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");

  const handleSearch = async () => {
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          track: songTitle,
          artist: artist,
          enhanced: true, // or false, based on your needs
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setLyrics(data.lyrics);
      onLyricsSearchSuccess(data.lyrics);
    } catch (error) {
      console.error("Error searching lyrics:", error);
    }
  };

  return (
    <div>
      <TextField
        id="songTitle"
        label="Song Title"
        placeholder="Song Title"
        value={songTitle}
        onChange={(e) => setSongTitle(e.target.value)}
      />
      <TextField
        id="artist"
        label="Artist"
        type="text"
        placeholder="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
      />
      <Button variant="contained" onClick={handleSearch}>
        Search Lyrics
      </Button>
    </div>
  );
};

export default LyricSearch;

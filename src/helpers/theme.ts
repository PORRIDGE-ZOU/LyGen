import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "rgb(30, 30, 40)", // Matches your dark background
      paper: "rgb(45, 45, 55)", // Card background
    },
    text: {
      primary: "#FFFFFF", // Bright white text
      secondary: "#CCCCCC", // Lighter text for contrast
    },
    divider: "#BBBBBB", // Brighter border color
    primary: {
      main: "#70AFFF", // Brighter primary color
    },
    secondary: {
      main: "#FFC4E0", // Accent color for buttons, etc.
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#FFFFFF",
          borderColor: "#BBBBBB",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgb(45, 45, 55)", // Card background
          color: "#FFFFFF", // Card text color
          borderColor: "#BBBBBB",
        },
      },
    },
  },
});

export default theme;

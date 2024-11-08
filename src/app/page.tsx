"use client"; // next.js app router

// ------------------ IMPORTS ------------------
import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { FabricObject, Canvas } from "fabric";
import { Box, Container } from "@mui/material";
import anime from "animejs/lib/anime.es.js";
import { LyricsLine } from "@/helpers/classes/LyricsLine";
import { LygenObject } from "@/helpers/classes/LygenObject";
import { PKeyframe } from "@/helpers/types/index";
import {
  PropList,
  P_Keyframes,
  AllObjects,
  globalRegulator,
  AllLyrics,
} from "@/helpers/globals";
import {
  enhancedLyricsParse,
  enhancedLyricsParseWithString,
} from "@/helpers/lyricsParsing";
import LyricsColumn from "@/components/LyricsColumn";
import LyricSearch from "@/components/LyricsSearch";
import GeneralPanel from "@/components/GeneralPanel";
import WidgetPanel from "@/components/WidgetPanel";
import InfoPanel from "@/components/InfoPanel";
import { newAudioLayer, reselect, setPropsToAnimText } from "@/helpers/misc";
import { animate } from "@/helpers/animation";
import { AnimatedText } from "@/helpers/classes/AnimatedText";

// ------------------ MAIN COMPONENT ------------------
const App = () => {
  // ------------------ STATE VARIABLES ------------------
  const [canvas, setCanvas] = useState<fabric.Canvas>();
  const [videoDuration, setVideoDuration] = useState<number>(10000);
  const [fillcolor, setFillColor] = useState("#ffffff");
  const [activeXPos, setActiveXPos] = useState<number>(0);
  const [activeYPos, setActiveYPos] = useState<number>(0);
  const [lyrics, setLyrics] = useState<string>("Test Lyrics\nTest Lyrics2");
  const [lyrics_forWidget, setLyrics_forWidget] = useState<string[][]>([]);
  /** This is only used for rerendering GeneralPanel. */
  const [currentTime, setCurrentTime] = useState<number>(
    Math.round(globalRegulator.currentTime)
  );

  // ------------------ Functions ------------------
  // CANVAS SETUP
  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      height: 540,
      width: 960,
      backgroundColor: "#000000",
    });

    // settings for all canvas in the app
    FabricObject.prototype.transparentCorners = false;
    FabricObject.prototype.cornerColor = "#2BEBC8";
    FabricObject.prototype.cornerStyle = "rect";
    FabricObject.prototype.cornerStrokeColor = "#2BEBC8";
    FabricObject.prototype.cornerSize = 6;
    canvas.selectionColor = "rgba(46, 115, 252, 0.11)";
    canvas.selectionBorderColor = "rgba(98, 155, 255, 0.81)";
    canvas.selectionLineWidth = 1.5;
    // Get any object by ID
    Canvas.prototype.getItemById = function (name) {
      var object = null;
      var objects = this.getObjects();
      for (var i = 0, len = this.size(); i < len; i++) {
        if (objects[i].get("type") == "group") {
          if (objects[i].get("id") && objects[i].get("id") === name) {
            object = objects[i];
            break;
          }
          var wip = i;
          for (
            var o = 0;
            o < (objects[i] as fabric.Group)._objects.length;
            o++
          ) {
            if (
              (objects[wip] as fabric.Group)._objects[o].id &&
              (objects[wip] as fabric.Group)._objects[o].id === name
            ) {
              object = (objects[wip] as fabric.Group)._objects[o];
              break;
            }
          }
        } else if (objects[i].id && objects[i].id === name) {
          object = objects[i];
          break;
        }
      }
      return object;
    };

    canvas.renderAll();
    canvasSetup(canvas);
    setCanvas(canvas);
    console.log("[App] canvas created and set");

    return () => {
      console.log("[App] canvas cleaning up");
      canvas.dispose();
    };
  }, []);

  // CURRENT TIME Hooked to the globalRegulator
  useEffect(() => {
    const interval = setInterval(() => {
      const roundedTime = Math.round(globalRegulator.currentTime);
      setCurrentTime((prevTime) => {
        if (prevTime !== roundedTime) {
          return roundedTime;
        }
        return prevTime;
      });
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, []);

  function canvasSetup(canvas: fabric.Canvas) {
    canvas.on("selection:created", (e) => {
      let active = canvas.getActiveObject();
      if (!active) {
        return;
      }
      let x = Math.round(active.get("left")!);
      let y = Math.round(active.get("top")!);
      setActiveXPos(x!);
      setActiveYPos(y!);
      let fill = active?.get("fill");
      if (fill.startsWith("rgb") && fill.includes(",") && fill.includes(")")) {
        const rgbValues = fill
          .substring(fill.indexOf("(") + 1, fill.indexOf(")"))
          .split(",")
          .map((val: string) => parseInt(val, 10));

        const hexColor = `#${rgbValues
          .map((val: { toString: (arg0: number) => string }) =>
            val.toString(16).padStart(2, "0")
          )
          .join("")}`;

        setFillColor(hexColor);
      } else {
        setFillColor(fill!);
      }

      let text = active?.get("text");
      if (text) {
        console.log("[canvasSetup] active text: ", text);
      }
    });

    canvas.on("selection:updated", (e) => {
      // TODO: Update the value in specific Animated Text object. Now, it will shift back once you play the video. -- GEORGE
      let active = canvas.getActiveObject();
      if (!active) {
        return;
      }
      let x = Math.round(active.get("left")!);
      let y = Math.round(active.get("top")!);
      setActiveXPos(x!);
      setActiveYPos(y!);
    });

    canvas.on("object:moving", (e) => {
      let active = canvas.getActiveObject();
      if (!active) {
        return;
      }
      let x = Math.round(active.get("left")!);
      let y = Math.round(active.get("top")!);
      setActiveXPos(x!);
      setActiveYPos(y!);
    });

    canvas.on("object:modified", (e) => {
      let action = e.action;
      let target = e.target;
      if (
        action == null ||
        !["scaleX", "scaleY", "scale", "drag", "rotate"].includes(action)
      ) {
        return;
      }
      if (target.type === "text") {
        let text = target as fabric.Text;
        let lyrics = AllLyrics.values();
        let animText = undefined;
        for (let line of lyrics) {
          for (let word of line) {
            if (word.textFabricObject === text) {
              animText = word;
              break;
            }
          }
        }
        if (animText == undefined) {
          console.warn("[canvasSetup] cannot find this text object");
          return;
        }
        setPropsToAnimText(animText, text);
        canvas.renderAll();
      } else if (target.type === "activeselection") {
        // NOTE: here, I get these objects by getting "_objects", which is NOT specified in the fabric.js documentation. They are REALLY BAD! -- GEORGE
        target.get("_objects").forEach((obj: FabricObject) => {
          let text = obj as fabric.Text;
          let lyrics = AllLyrics.values();
          let animText = undefined;
          for (let line of lyrics) {
            for (let word of line) {
              if (word.textFabricObject === text) {
                animText = word;
                break;
              }
            }
          }
          if (animText == undefined) {
            console.warn("[canvasSetup] cannot find this text object");
            return;
          }
          let realLeft = target.left + text.left;
          let realTop = target.top + text.top;
          animText.props.left = realLeft;
          animText.props.top = realTop;
          animText.props.scaleX = text.scaleX! * target.scaleX!;
          animText.props.scaleY = text.scaleY! * target.scaleY!;
          canvas.renderAll();
        });
      }
    });
  }

  function onPositionChange(
    event: React.ChangeEvent<HTMLInputElement>,
    pos: string
  ) {
    let active = canvas?.getActiveObject();
    if (!active) {
      return;
    }
    // the code below can also handle group selection. -- GEORGE
    if (pos === "x") {
      setActiveXPos(parseInt(event.target.value));
      active?.set({ left: parseInt(event.target.value) });
    } else {
      setActiveYPos(parseInt(event.target.value));
      active?.set({ top: parseInt(event.target.value) });
    }
    canvas?.renderAll();
    // reselect(active!, canvas!);
  }

  function onColorChange(newcolor: string) {
    let active = canvas?.getActiveObject();
    if (!active) {
      return;
    }
    if (active.get("type") === "activeselection") {
      // this means it's a group selection -- GEORGE
      let objects = (active as fabric.Group).getObjects();
      objects.forEach((object) => {
        object.set({ fill: newcolor });
      });
      setFillColor(newcolor);
      canvas?.renderAll();
      return;
    }
    active?.set({ fill: newcolor });
    setFillColor(newcolor);
    canvas?.renderAll();
    // reselect(active!, canvas!);
    // canvas?.discardActiveObject();
  }

  const onChangeVideoDuration = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVideoDuration(parseInt(event.target.value));
  };

  const onAudioUpload = (file: File) => {
    if (!file) {
      console.error("[onAudioUpload] file is undefined");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        return;
      }
      const audio = new Audio(e.target.result as string);
      audio.onloadedmetadata = () => {
        let durationWhole = Math.ceil(audio.duration);
        setVideoDuration(durationWhole * 1000);
        newAudioLayer(e.target!.result as string, canvas!);
        console.log(
          "[onAudioUpload] audio uploaded! audio duration: " + durationWhole
        );
      };
    };
    reader.readAsDataURL(file);
  };

  const onLyricsUpload = (file: File) => {
    enhancedLyricsParse(file, canvas!, onEnhancedLyricObjectsChange);
  };

  /** Do stuff after the new lyrics are uploaded and parsed */
  const onBasicLyricObjectsChange = (lyrics: LyricsLine[]) => {
    let newLyrics: string = "";
    lyrics.forEach((line, index) => {
      var endTime = lyrics[index + 1]
        ? lyrics[index + 1].timeInSeconds
        : line.getTimeInSeconds() + 5;
      newLyrics += line.text;
      newLyrics += "[" + line.timeInSeconds + " -- " + endTime + "]\n";
    });
    setLyrics(newLyrics);
  };

  const onEnhancedLyricObjectsChange = (lyrics: LyricsLine[]) => {
    let newLyrics: string = "";
    let currentLyrics_forWidget: string[][] = [[]];
    let stringindex = 0;
    lyrics.forEach((word, index) => {
      newLyrics += word.text;
      currentLyrics_forWidget[stringindex].push(word.text);
      if (word.isEnhancedSentenceEnd) {
        newLyrics += "\n";
        stringindex++;
        currentLyrics_forWidget.push([]);
      } else {
        newLyrics += " ";
      }
    });
    setLyrics(newLyrics);
    setLyrics_forWidget(currentLyrics_forWidget);
    console.log(
      "[onEnhancedLyricObjectsChange] finished populating lyrics to widget/lyrics column"
    );
  };

  const onSeekToTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let time = parseFloat(event.target.value);
    if (time < 0 || time > videoDuration || isNaN(time)) {
      console.warn("[onSeekToTimeChange] invalid time: " + time);
      return;
    }
    globalRegulator.setCurrentTime(time);
    animate(false, time, canvas!, AllObjects, P_Keyframes, videoDuration);
  };

  const onLyricsSearchSuccess = (lyrics: string) => {
    // lyricsParseWithString(lyrics, canvas!, onLyricObjectsChange);
    enhancedLyricsParseWithString(
      lyrics,
      canvas!,
      onEnhancedLyricObjectsChange
    );
  };

  // ------------------ RENDER ------------------
  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      style={{ width: "100vw", height: "100vh" }}
    >
      <Box display="flex" flexDirection="row" width="100%" height="65%">
        <Box width="25%">
          <LyricsColumn
            onLyricsChange={() => {}}
            lyrics={lyrics}
            setLyrics={setLyrics}
          />
          <LyricSearch onLyricsSearchSuccess={onLyricsSearchSuccess} />
        </Box>
        <Box width="100%">
          <canvas id="canvas" />
        </Box>
        <Box width="25%">
          <InfoPanel
            activeXPos={activeXPos}
            activeYPos={activeYPos}
            onPositionChange={onPositionChange}
            color={fillcolor}
            onColorChange={onColorChange}
            text={fillcolor}
            onTextChange={setFillColor}
          ></InfoPanel>
        </Box>
      </Box>
      <Box display="flex" flexDirection="row" width="100%" height="35%">
        <Box width="30%" height="100%">
          <GeneralPanel
            onPlayClick={() => {
              globalRegulator.resume();
              animate(
                true,
                globalRegulator.currentTime,
                canvas!,
                AllObjects,
                P_Keyframes,
                videoDuration
              );
            }}
            onPauseClick={() => {
              globalRegulator.pause();
            }}
            currentTime={currentTime}
            videoDuration={videoDuration}
            onChangeVideoDuration={onChangeVideoDuration}
            onAudioUpload={onAudioUpload}
            onLyricsUpload={onLyricsUpload}
            onSeekToTimeChange={onSeekToTimeChange}
          ></GeneralPanel>
        </Box>
        <Box whiteSpace={"pre-wrap"} width="70%" height="100%">
          <WidgetPanel
            currentLyrics={lyrics_forWidget}
            reAnimate={() => {
              animate(
                false,
                globalRegulator.currentTime,
                canvas!,
                AllObjects,
                P_Keyframes,
                videoDuration
              );
            }}
          ></WidgetPanel>
        </Box>
      </Box>
    </Container>
  );
};

// Create an audio layer

export default App;

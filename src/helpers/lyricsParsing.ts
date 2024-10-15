import { newLayer } from "@/app/page";
import { newTextbox } from "./canvasMisc";
import { activeLyrics, allObjects, p_keyframes, ticker } from "./globals";
import { addAnimatedText, AnimatedText, LyricsLine } from "./types";
import * as fabric from "fabric";

export function lyricsParse(
  file: File,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (e) {
    // alert file name
    console.log(reader.result);
    var lyrics = reader.result;
    lyricsParseWithString(lyrics as string, canvas, onLyricsUpload);
  };
}
export function lyricsParseWithString(
  lyrics: String,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  var lyricsArray = (lyrics as string).split("\n");
  var lyricsObjects: LyricsLine[] = [];
  lyricsArray.forEach(function (line) {
    var time = line.split("]")[0].split("[")[1];
    // text should start from the second character, because the first one is space
    var text = line.split("]")[1].substring(1);
    var lyrics = new LyricsLine(text, time);
    lyricsObjects.push(lyrics);
  });
  console.log(lyricsObjects);

  lyricsObjects.forEach(function (line, index) {
    // duration should be the next index's time - this time
    // var duration = 0;
    // duration = lyricsObjects[index + 1] ?
    //   (lyricsObjects[index + 1].timeInSeconds - line.timeInSeconds) * 1000 :
    //   5000; // HOW TO SET DEFAULT? --GEORGE
    var endTime = lyricsObjects[index + 1]
      ? lyricsObjects[index + 1].timeInSeconds * 1000
      : line.getTimeInSeconds() * 1000 + 5000;

    console.log(
      "[lyricsParse] start and endTime: " +
        line.timeInSeconds * 1000 +
        " " +
        endTime
    );
    newTextbox(
      30,
      700,
      line.getText(),
      960,
      540,
      200,
      true,
      "Inter",
      canvas,
      line.getTimeInSeconds() * 1000,
      endTime
    );
    // canvas.renderAll();
  });
  canvas.renderAll();
  onLyricsUpload(lyricsObjects);
}
export function enhancedLyricsParse(
  file: File,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (e) {
    console.log(reader.result);
    var lyrics = reader.result;
    enhancedLyricsParseWithString(lyrics as string, canvas, onLyricsUpload);
  };
}

export function enhancedLyricsParseWithString(
  lyrics: String,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  console.log("[enhanedLyricsParseWithString] lyrics: " + lyrics);
  var lyricsArray = (lyrics as string).split("\n");
  var lyricsObjects: LyricsLine[] = [];

  const invalidCharacterPattern = /[^<>0-9:. ]/;
  function findNextInvalidCharacterIndex(
    str: string,
    i: number
  ): number | null {
    if (i < 0 || i >= str.length) {
      throw new Error("Invalid starting index.");
    }
    for (let index = i; index < str.length; index++) {
      if (invalidCharacterPattern.test(str[index])) {
        return index; // Return the index of the first invalid character
      }
    }
    for (let index = i; index < str.length; index++) {
      if (
        str[index] !== "<" &&
        str[index] !== " " &&
        str[index] !== ">" &&
        str[index] !== ":" &&
        str[index] !== "." &&
        // is not number
        isNaN(parseInt(str[index]))
      ) {
        return index; // Return null if no such character is found
      }
    }
    return null; // Return null if no such character is found
  }
  lyricsArray.forEach(function (line, index) {
    // each line is in this format: [00:08.69] <00:08.69> I <00:08.75>   <00:08.81> got <00:08.91>   <00:09.02> my <00:09.18>   <00:09.35> driver's <00:10.34>   <00:10.73> license <00:10.95>   <00:11.18> last <00:11.36>   <00:11.54> week
    console.log("line: " + line);
    if (line == "") {
      return;
    }

    // split out the [] part first
    var startTime = line.split("]")[0].split("[")[1]; // this will be "00:08.69"
    var nextLineStartTime = "";
    if (index != lyricsArray.length - 1) {
      nextLineStartTime = lyricsArray[index + 1].split("]")[0].split("[")[1];
    }
    var hasReachedEnd = false;
    var currentIndex = 10;
    var exeSafety = 0;
    line = line.trim();
    while (!hasReachedEnd) {
      exeSafety++;
      if (exeSafety > 1000) {
        console.log(
          "Safety break -- there is something wrong with the lyrics parsing."
        );
        break;
      }
      var nextWordIndex = findNextInvalidCharacterIndex(line, currentIndex);
      // if there is no invalid character, then we have reached the end of the line
      if (nextWordIndex == null) {
        hasReachedEnd = true;
        break;
      }
      // find the last index of '>' before this nextWordIndex
      var lastRightBracketIndex = line.lastIndexOf(">", nextWordIndex);
      var lastLeftBracketIndex = line.lastIndexOf("<", lastRightBracketIndex);
      var nextLeftBracket = line.indexOf("<", lastLeftBracketIndex + 1);
      var nextRightBracket = line.indexOf(">", lastRightBracketIndex + 1);
      if (nextLeftBracket == -1) {
        hasReachedEnd = true;
      }
      var wordStartTime = line.substring(
        lastLeftBracketIndex + 1,
        lastRightBracketIndex
      );
      var wordEndTime = line.substring(nextLeftBracket + 1, nextRightBracket);
      if (hasReachedEnd) {
        wordEndTime = nextLineStartTime;
      }
      var word = line
        .substring(
          lastRightBracketIndex + 1,
          hasReachedEnd ? line.length : nextLeftBracket
        )
        .trim();
      console.log(
        "[lyrics] word: " +
          word +
          " start: " +
          wordStartTime +
          " end: " +
          wordEndTime
      );
      var lyrics = new LyricsLine(
        word,
        wordStartTime,
        true,
        hasReachedEnd,
        wordEndTime,
        nextLineStartTime
      );
      lyricsObjects.push(lyrics);
      console.log("new lyrics: " + lyrics.getText());
      currentIndex = nextRightBracket + 1;

      // This is the previous implementation, which is not working for specific patterns of lyrics. --GEORGE
      // var nextLeftBracket = line.indexOf("<", currentIndex);
      // var nextRightBracket = line.indexOf(">", currentIndex);
      // var nextNextLeftBracket = line.indexOf("<", nextRightBracket);
      // var nextNextRightBracket = line.indexOf(">", nextNextLeftBracket);
      // if (nextNextLeftBracket == -1) {
      //   hasReachedEnd = true;
      // }
      // var wordStartTime = line.substring(nextLeftBracket + 1, nextRightBracket);
      // var word = line.substring(
      //   nextRightBracket + 1,
      //   nextNextLeftBracket == -1 ? line.length : nextNextLeftBracket
      // );
      // var wordEndTime = line.substring(
      //   nextNextLeftBracket + 1,
      //   nextNextRightBracket
      // );
      // if (hasReachedEnd) {
      //   wordEndTime = nextLineStartTime;
      // }
      // word = word.trim();
      // var lyrics = new LyricsLine(
      //   word,
      //   wordStartTime,
      //   true,
      //   hasReachedEnd,
      //   wordEndTime,
      //   nextLineStartTime
      // );
      // lyricsObjects.push(lyrics);
      // console.log("new lyrics: " + lyrics.getText());
      // currentIndex = nextNextRightBracket + 1;
    }
  });

  // loop over the lyrics objects, combine words into lines, and calculate the width of the line
  let ctx = canvas!.getContext();
  ctx.font = "400 24px Source Sans Pro";
  var widthOfSpace = ctx.measureText(" ").width + 0;
  let lineWidths: number[] = [];
  var currentLine = "";
  var currentWidth = 0;
  lyricsObjects.forEach(function (word, index) {
    currentLine += word.getText();
    currentLine += " ";
    currentWidth += ctx.measureText(word.getText()).width + 0;
    currentWidth += widthOfSpace;
    if (word.isEnhancedSentenceEnd) {
      lineWidths.push(currentWidth);
      currentLine = "";
      currentWidth = 0;
    }
  });

  /**
   * TODO: look at the measurement of text below. Now, the schema is:
   * 1. Measure the text width of each word
   * 2. Measure the width of space " "
   * 3. Add them on to calculate the width of each line
   * 4. When we start adding textboxes, we calculate the starting position of each line by subtracting half of the line width from the center of the canvas
   * 5. We add the width of each word and the width of space to calculate the next position of the textbox. Since each box is ORIGIN-CENTERED, we need to separate the addition of text width into two halves.
   * Using this method, the text is centered, but the space between words is not consistent. This is very strange. I've also observed that the width measurement for each text block is NOT ACCURATE. --GEORGE
   */
  // loop over the lyrics objects, create textboxes for each word
  var currentLineIndex = 0;
  var centerX = 480;
  var nextXPos = 480 - lineWidths[currentLineIndex] / 2;
  console.log("[enhancedLPwString] INITIAL POSITION: " + nextXPos);
  let mapEntries: [number, AnimatedText[]][] = [];
  lyricsObjects.forEach(function (word, index) {
    var endTime = word.enhancedSentenceEndTime * 1000;
    nextXPos += ctx.measureText(word.getText()).width / 2 + 0;

    let newtext = addAnimatedText(
      word.getText(),
      "AnimText" + ticker.getAndUpdateCurrentIndex(),
      nextXPos,
      270,
      canvas,
      word.getTimeInSeconds() * 1000,
      endTime
    );

    if (mapEntries.length == 0) {
      mapEntries.push([endTime, [newtext]]);
    } else {
      let lastEntry = mapEntries[mapEntries.length - 1];
      if (lastEntry[0] == endTime) {
        lastEntry[1].push(newtext);
      } else {
        mapEntries.push([endTime, [newtext]]);
      }
    }

    if (word.isEnhancedSentenceEnd) {
      currentLineIndex++;
      nextXPos = centerX - lineWidths[currentLineIndex] / 2;
    } else {
      nextXPos += ctx.measureText(word.getText()).width / 2;
      nextXPos += widthOfSpace;
      console.log(
        "current word: " +
          word.getText() +
          ", current word width: " +
          ctx.measureText(word.getText()).width
      );
    }
  });

  // NOTE: populate the activeLyrics map in a SORTED way. Hence, later when we seek the active lyrics, we can do a binary search without sorting. -- GEORGE
  mapEntries.sort((a, b) => a[0] - b[0]);
  for (let [key, value] of mapEntries) {
    activeLyrics.set(key, value);
  }

  canvas.renderAll();
  onLyricsUpload(lyricsObjects);
}

export function findCurrentAndNextLyrics(time: number) {
  // NOTE: No need to sort, as the activeLyrics map is already sorted when we populate it -- GEORGE
  // let keys = Array.from(activeLyrics.keys()).sort((a, b) => a - b); // Sorting if not already sorted
  let keys = Array.from(activeLyrics.keys());
  for (let key of keys) {
    let texts = activeLyrics.get(key);
    let finaltext = texts![texts!.length - 1];
    key -= finaltext!.animateDuration!;
  }
  function findClosestGreaterOrEqual(
    keys: number[],
    target: number
  ): number | null {
    let low = 0;
    let high = keys.length - 1;
    let result: number | null = null;

    while (low <= high) {
      let mid = Math.floor((low + high) / 2);

      if (keys[mid] === target) {
        return keys[mid]; // Exact match
      } else if (keys[mid] > target) {
        result = keys[mid]; // Store potential result
        high = mid - 1; // Search in the lower half
      } else {
        low = mid + 1; // Search in the upper half
      }
    }

    return result; // This will be the smallest key larger than or equal to the target
  }
  let closestKey = findClosestGreaterOrEqual(keys, time);
  if (closestKey) {
    let result = activeLyrics.get(closestKey);
    let nextkey: number | null = null;
    let previouskey: number | null = null;
    for (let key of keys) {
      if (key == closestKey) {
        let index = keys.indexOf(key);
        if (index < keys.length - 1) {
          nextkey = keys[index + 1];
        }
        if (index > 0) {
          previouskey = keys[index - 1];
        }
      }
    }
    let next = activeLyrics.get(nextkey!);
    let previous = activeLyrics.get(previouskey!);
    if (next) {
      result = result!.concat(next);
    }
    // if (previous) {
    //   result = result!.concat(previous);
    // } // We don't need the previous, logically. Not for now. -- GEORGE
    return result!;
  } else {
    return [];
  }
}

export function findLyricsAroundTime(time: number) {
  let keys = Array.from(activeLyrics.keys());
  for (let key of keys) {
  }
}

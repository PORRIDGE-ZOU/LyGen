import { FabricObject } from "fabric";

declare module "fabric" {
  interface Canvas {
    getItemById(name: string): FabricObject | null;
  }

  interface Object {
    id: string;
    defaults: Array<{ name: string; value: any }>;
  }
}
// Declare a new type p_keyframes
export type PKeyframe = {
  start: number; // The start time from where you CANNOT trim the object anymore ahead
  end: number; // The end time where you CANNOT trim the object anymore behind
  trimstart: number; // The start time OFFSET from [start] where you can trim the object
  trimend: number; // The end time OFFSET from [end] where you can trim the object
  object: Object;
  id: string;
};

export class LyricsLine {
  text = "DEFAULT LINE (Something is wrong)";
  timeString = "00:00.00";
  timeInSeconds = 0;
  enhanced = false;
  isEnhancedSentenceEnd = false;
  enhancedWordEndTime = 0;
  enhancedSentenceEndTime = 0;
  constructor(
    text: string,
    timeString: string,
    enhanced = false,
    isEnhancedSentenceEnd = false,
    enhancedWordEndString = "",
    enhancedSentenceEndString = ""
  ) {
    this.text = text;
    this.timeString = timeString;
    this.timeInSeconds = this.convertTimeToSeconds(timeString);
    this.enhanced = enhanced;
    if (!enhanced) {
      // If the line is not enhanced, we don't need to check for enhanced sentence end
      return;
    }
    this.isEnhancedSentenceEnd = isEnhancedSentenceEnd;
    if (enhancedWordEndString != "") {
      this.enhancedWordEndTime = this.convertTimeToSeconds(
        enhancedWordEndString
      );
    } else {
      this.enhancedWordEndTime = this.timeInSeconds + 5;
      // console.log(
      //   "enhancedWordEndString is empty. Set to " + this.enhancedWordEndTime
      // );
    }
    if (enhancedSentenceEndString != "") {
      this.enhancedSentenceEndTime = this.convertTimeToSeconds(
        enhancedSentenceEndString
      );
    } else {
      this.enhancedSentenceEndTime = this.timeInSeconds + 5;
      // console.log(
      //   "enhancedSentenceEndString is empty. Set to " +
      //     this.enhancedSentenceEndTime
      // );
    }
  }
  getText() {
    return this.text;
  }
  getTimeInSeconds() {
    return this.timeInSeconds;
  }
  convertTimeToSeconds(timeString: string) {
    var minutes = parseInt(timeString.split(":")[0]);
    var seconds = parseInt(timeString.split(":")[1].split(".")[0]);
    var milliseconds = parseInt(timeString.split(":")[1].split(".")[1]);
    var result = minutes * 60 + seconds + milliseconds / 100;
    // console.log(
    //   "convert time to seconds: " + result + " for " + this.getText()
    // );
    return minutes * 60 + seconds + milliseconds / 100;
  }
}

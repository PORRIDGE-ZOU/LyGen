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
      return;
    }
    this.isEnhancedSentenceEnd = isEnhancedSentenceEnd;
    if (enhancedWordEndString != "") {
      this.enhancedWordEndTime = this.convertTimeToSeconds(
        enhancedWordEndString
      );
    } else {
      this.enhancedWordEndTime = this.timeInSeconds + 5;
    }
    if (enhancedSentenceEndString != "") {
      this.enhancedSentenceEndTime = this.convertTimeToSeconds(
        enhancedSentenceEndString
      );
    } else {
      this.enhancedSentenceEndTime = this.timeInSeconds + 5;
    }
  }

  getText() {
    return this.text;
  }

  getTimeInSeconds() {
    return this.timeInSeconds;
  }

  private convertTimeToSeconds(timeString: string) {
    var minutes = parseInt(timeString.split(":")[0]);
    var seconds = parseInt(timeString.split(":")[1].split(".")[0]);
    var milliseconds = parseInt(timeString.split(":")[1].split(".")[1]);
    return minutes * 60 + seconds + milliseconds / 100;
  }
}

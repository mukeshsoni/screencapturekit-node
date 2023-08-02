import { temporaryFile } from "tempy";
import os from "os";
import { assertMacOSVersionGreaterThanOrEqualTo } from "macos-version";
import fileUrl from "file-url";
import path from "path";
// import { fixPathForAsarUnpack } from "electron-util";
import { execa } from "execa";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getRandomId = () => Math.random().toString(36).slice(2, 15);
// Workaround for https://github.com/electron/electron/issues/9459
// const BIN = path.join(fixPathForAsarUnpack(__dirname), "aperture");
const BIN = path.join(__dirname, "screencapturekit-cli");

const supportsHevcHardwareEncoding = (() => {
  const cpuModel = os.cpus()[0].model;

  // All Apple silicon Macs support HEVC hardware encoding.
  if (cpuModel.startsWith("Apple ")) {
    // Source string example: `'Apple M1'`
    return true;
  }

  // Get the Intel Core generation, the `4` in `Intel(R) Core(TM) i7-4850HQ CPU @ 2.30GHz`
  // More info: https://www.intel.com/content/www/us/en/processors/processor-numbers.html
  // Example strings:
  // - `Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz`
  // - `Intel(R) Core(TM) i7-4850HQ CPU @ 2.30GHz`
  const result = /Intel.*Core.*i\d+-(\d)/.exec(cpuModel);

  // Intel Core generation 6 or higher supports HEVC hardware encoding
  return result && Number.parseInt(result[1], 10) >= 6;
})();

class ScreenCaptureKit {
  videoPath = null;

  constructor() {
    assertMacOSVersionGreaterThanOrEqualTo("10.13");
  }

  throwIfNotStarted() {
    if (this.recorder === undefined) {
      throw new Error("Call `.startRecording()` first");
    }
  }

  async startRecording({
    fps = 30,
    cropArea = undefined,
    showCursor = true,
    highlightClicks = false,
    screenId = 0,
    audioDeviceId = undefined,
    videoCodec = "h264",
  } = {}) {
    this.processId = getRandomId();
    return new Promise((resolve, reject) => {
      if (this.recorder !== undefined) {
        reject(new Error("Call `.stopRecording()` first"));
        return;
      }

      this.videoPath = temporaryFile({ extension: "mp4" });

      const recorderOptions = {
        destination: fileUrl(this.videoPath),
        framesPerSecond: fps,
        showCursor,
        highlightClicks,
        screenId,
        audioDeviceId,
      };

      this.recorder = execa(BIN, [
        // "record",
        // "--process-id",
        // this.processId,
        JSON.stringify(recorderOptions),
      ]);

      resolve({});
    });
  }

  async stopRecording() {
    this.throwIfNotStarted();
    console.log("killing recorder");
    this.recorder.kill();
    await this.recorder;
    console.log("killed recorder");
    delete this.recorder;
    // delete this.isFileReady;

    return this.videoPath;
  }
}

export default function () {
  return new ScreenCaptureKit();
}

function getCodecs() {
  const codecs = new Map([
    ["h264", "H264"],
    ["hevc", "HEVC"],
    ["proRes422", "Apple ProRes 422"],
    ["proRes4444", "Apple ProRes 4444"],
  ]);

  if (!supportsHevcHardwareEncoding) {
    codecs.delete("hevc");
  }

  return codecs;
}
export const videoCodecs = getCodecs();

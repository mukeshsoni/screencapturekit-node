import fs from "node:fs";
import { test, expect, afterEach } from "vitest";
// import test from "ava";
import delay from "delay";
import { readChunkSync } from "read-chunk";
import { fileTypeFromBuffer } from "file-type";
import sck, { videoCodecs, screens } from "./index.ts";

let videoPath;
afterEach(() => {
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
    videoPath = undefined;
  }
});

test("returns available codecs", () => {
  console.log("Video codecs", videoCodecs);
  expect(videoCodecs.has("h264")).toBe(true);
});

test("records screen", async (t) => {
  const recorder = sck();
  await recorder.startRecording();
  // t.true(fs.existsSync(await recorder.isFileReady));
  await delay(4000);
  videoPath = await recorder.stopRecording();
  console.log({ videoPath });
  expect(fs.existsSync(videoPath)).toBeTruthy();
  const fileInfo = await fileTypeFromBuffer(
    readChunkSync(videoPath, { startPosition: 0, length: 4100 })
  );
  console.log({ fileInfo });
  expect(fileInfo.ext).toBe("mov");
}, 10000);

test("List of screens", async () => {
  const screenList = await screens();
  console.log({ screenList });
  expect(screenList.length).toBeGreaterThan(0);
});

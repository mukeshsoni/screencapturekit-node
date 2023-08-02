import fs from "fs";
import test from "ava";
import delay from "delay";
import { readChunkSync } from "read-chunk";
import { fileTypeFromBuffer } from "file-type";
import sck, { videoCodecs } from "./index.mjs";

test("returns available codecs", (t) => {
  console.log("Video codecs", videoCodecs);
  t.true(videoCodecs.has("h264"));
});

test("records screen", async (t) => {
  const recorder = sck();
  await recorder.startRecording();
  // t.true(fs.existsSync(await recorder.isFileReady));
  await delay(4000);
  const videoPath = await recorder.stopRecording();
  console.log({ videoPath });
  t.true(fs.existsSync(videoPath));
  const fileInfo = await fileTypeFromBuffer(
    readChunkSync(videoPath, { startPosition: 0, length: 4100 })
  );
  console.log({ fileInfo });
  t.is(fileInfo.ext, "mov");
  // if any assertion after file creation fails, the file is not deleted and remains there forever
  fs.unlinkSync(videoPath);
});

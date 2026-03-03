import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');

export default {
  codec: 'h264',
  crf: 1,
  fps: 30,
  imageFormat: 'jpeg',
  pixelFormat: 'yuv420p',
  quality: 100,
};
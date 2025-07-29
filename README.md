# Audio Splitter
A web-based tool for analyzing long audio files, detecting silence, and splitting them into named segments for easier processing. Originally developed to split audiobooks into individual chapters.

## Requirements
Before running the project, make sure the following tools are installed:

- [ffmpeg](https://ffmpeg.org/) - for audio processing
    - Make sure both `ffmpeg` and `ffprobe` are available in your system's `PATH`.
- [audiowaveform](https://github.com/bbc/audiowaveform) - for generating binary waveform data
    - Place the `audiowaveform` executable inside the local `bin/` directory.
- [NodeJS](https://nodejs.org/en) - tested for v22.15.0
    - Install project dependencies via: `npm install`.

## Usage
The audio files intended for processing need to be placed into the `public/media/` directory.

The development server and websocket server can be run simultaneously with `npm run dev:all`. To run both processes separately run `npm run dev` and `npm run ws`.

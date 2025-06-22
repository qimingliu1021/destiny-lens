import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Audio,
} from "remotion";

// Use the FastAPI server's address for your files
const SERVER = "http://127.0.0.1:8000";
const images = [
  `${SERVER}/images/fast-0.jpg`,
  `${SERVER}/images/fast-1.jpg`,
  `${SERVER}/images/fast-2.jpg`,
  `${SERVER}/images/fast-3.jpg`,
];
const poemURL = `${SERVER}/poem/poem.mp3`;
const musicURL = `${SERVER}/music/tianxingjiuge.mp3`;

// const images = [img0, img1, img2, img3];

const VIDEO_DURATION_SECONDS = 60;

export const Slideshow = () => {
  const frame = useCurrentFrame();

  // Each image gets 3 seconds (90 frames at 30fps)
  const imageIndex = Math.floor(frame / 90);
  const currentImage = images[Math.min(imageIndex, images.length - 1)];

  // Fade transition effect
  const fadeIn = interpolate(frame % 90, [0, 30], [0, 1]);
  const fadeOut = interpolate(frame % 90, [60, 90], [1, 0]);
  const opacity = Math.min(fadeIn, fadeOut);

  // Zoom effect
  const zoom = interpolate(frame % 90, [0, 90], [1, 1.1]);

  // Audio volume control - fade in at start, fade out at end
  const volume1 = 0.8; // 80% volume for first audio
  const volume2 = 0.3; // 30% volume for second audio

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <Img
        src={currentImage}
        style={{
          transform: `scale(${zoom})`,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: opacity,
        }}
      />

      {/* First audio */}
      <Audio src={poemURL} volume={volume1} loop={false} />

      {/* Second audio, different volume */}
      <Audio src={musicURL} volume={volume2} loop={false} />
    </AbsoluteFill>
  );
};

import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Audio,
  staticFile,
} from "remotion";

// Import images directly
import img0 from "./0.jpg";
import img1 from "./1.jpg";
import img2 from "./2.jpg";
import img3 from "./3.jpg";
import audio from "./song.mp3";

const images = [img0, img1, img2, img3];

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
  const audioVolume = interpolate(
    frame,
    [0, 30, 210, 240], // frames
    [0, 1, 1, 0] // volume levels
  );

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

      <Audio
        src={audio}
        volume={audioVolume}
        loop={false} // Set to true if you want the audio to loop
      />
    </AbsoluteFill>
  );
};

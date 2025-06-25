import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Audio,
} from "remotion";

// Use string paths instead of imports for Remotion
const images = [
  "/api/video-generation/images/0.jpg",
  "/api/video-generation/images/1.jpg",
  "/api/video-generation/images/2.jpg",
  "/api/video-generation/images/3.jpg",
  "/api/video-generation/images/4.jpg",
  "/api/video-generation/images/5.jpg",
  "/api/video-generation/images/6.jpg",
  "/api/video-generation/images/7.jpg",
];

export const Slideshow = () => {
  const frame = useCurrentFrame();
  const imageDuration = 90; // 3 seconds per image at 30fps
  const currentIndex = Math.floor(frame / imageDuration) % images.length;

  const currentImage = images[currentIndex];

  // console.log("currentImage", currentImage);

  const localFrame = frame % imageDuration;

  // Fade in/out effect
  const fadeIn = interpolate(localFrame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(localFrame, [60, 90], [1, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  // Zoom effect
  const zoom = interpolate(localFrame, [0, imageDuration], [1, 1.1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* <Img
        src={currentImage}
        style={{
          transform: `scale(${zoom})`,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity,
        }}
      /> */}

      {/* 🎵 Play both audio tracks together - Fixed paths */}
      <Audio src="/poem.mp3" volume={0.8} loop />
      <Audio src="/grand_1.mp3" volume={0.3} loop />
    </AbsoluteFill>
  );
};

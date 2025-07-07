import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Audio,
  staticFile,
} from "remotion";

// Fallback images (local)
const fallbackImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
];

export const Slideshow: React.FC<{
  imageUrls?: string[];
}> = ({ imageUrls }) => {
  const frame = useCurrentFrame();
  const imageDuration = 90; // 3 seconds per image at 30fps

  // Use provided image URLs or fallback
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : fallbackImages;

  const currentIndex = Math.floor(frame / imageDuration) % images.length;
  const currentImage = images[currentIndex];

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
      <Img
        src={currentImage}
        style={{
          transform: `scale(${zoom})`,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity,
        }}
      />

      <Audio src={staticFile("poem.mp3")} volume={0.8} loop />
      <Audio src={staticFile("grand_1.mp3")} volume={0.3} loop />
    </AbsoluteFill>
  );
};

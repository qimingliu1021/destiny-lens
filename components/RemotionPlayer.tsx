// components/RemotionPlayer.tsx
"use client";
import { Player } from "@remotion/player";
import { Slideshow } from "../app/remotion/Slideshow";

export default function RemotionPlayer() {
  console.log("RemotionPlayer is on");
  return (
    <Player
      component={Slideshow}
      durationInFrames={1800}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      style={{
        width: "100%",
        maxWidth: "800px",
        aspectRatio: "16/9",
      }}
      controls
      loop
      autoPlay
      showVolumeControls
      allowFullscreen
      clickToPlay
      doubleClickToFullscreen
      spaceKeyToPlayOrPause
      acknowledgeRemotionLicense
    />
  );
}

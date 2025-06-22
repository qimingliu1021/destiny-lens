// components/RemotionPlayer.tsx
"use client";
import { Player } from "@remotion/player";
import { MyComp } from "../app/remotion/Composition"; // adjust path as needed

export default function RemotionPlayer() {
  return (
    <Player
      component={MyComp}
      inputProps={{ text: "World" }}
      durationInFrames={120}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      style={{
        width: 1280,
        height: 720,
      }}
      controls
      acknowledgeRemotionLicense
    />
  );
}

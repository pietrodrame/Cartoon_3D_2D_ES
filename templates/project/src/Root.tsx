import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { VasaTest, VASA_FRAMES } from "./videos/vasa/Vasa";
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="VasaTest" component={VasaTest} durationInFrames={VASA_FRAMES} fps={30} width={1080} height={1920} />
  </>
);

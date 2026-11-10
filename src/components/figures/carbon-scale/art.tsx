import * as React from "react";
import { Dots, FaceText, Line, Solid } from "@/components/iso/react/draw";
import { BASE_ART, BODY_ART, DIAL_ART, PAN_ART, SAMPLE_ART } from "./geometry";
import { ScaleLive } from "./live";
import type { ScaleSample } from "./model";

const BASE = (
  <g key="base">
    <path className="iso-halo" d={BASE_ART.halo} />
    {BASE_ART.feet.map((parts, index) => (
      <g key={index}>
        {parts.map((paths, part) => (
          <Solid key={part} paths={paths} tone={part ? "mid" : "lo"} crease="faint" />
        ))}
      </g>
    ))}
    <Solid paths={BASE_ART.slab} tone="mid" crease="faint" />
    <Line d={BASE_ART.groove} tone="lo" />
    <Line d={BASE_ART.screwRings} tone="lo" />
    <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
    <Solid paths={BASE_ART.knobCollar} tone="lo" crease="faint" />
    <Solid paths={BASE_ART.knob} tone="mid" crease="faint" />
    <Line d={BASE_ART.knobKnurl} tone="lo" />
    <Line d={BASE_ART.knobPointer} tone="hi" />
    <Dots points={BASE_ART.knobCentre} size={0.5} tone="hi" />
    <Solid paths={BASE_ART.level} tone="mid" crease="faint" />
    <Line d={BASE_ART.levelRing} tone="lo" />
    <Dots points={BASE_ART.levelBubble} size={0.9} tone="mid" />
  </g>
);

const BODY = (
  <g key="body">
    <path className="iso-halo ck-soft" d={BODY_ART.halo} />
    <Solid paths={BODY_ART.slab} tone="mid" crease="faint" inner={<Line d={BODY_ART.seams} tone="faint" />} />
    <Line d={BODY_ART.vents} tone="lo" />
    <Solid paths={BODY_ART.label} tone="lo" crease="none" />
    <Line d={BODY_ART.labelRules} tone="lo" free />
    <Dots points={BODY_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

const DIAL = (
  <g key="dial">
    <Solid paths={DIAL_ART.plate} tone="mid" crease="faint" />
    <Dots points={DIAL_ART.plateScrews} size={0.5} tone="mid" />
    <Solid paths={DIAL_ART.bezel} tone="hi" crease="lo" />
    <Line d={DIAL_ART.bezelRing} tone="lo" />
    <Line d={DIAL_ART.faceRing} tone="faint" />
    <Line d={DIAL_ART.minor} tone="lo" />
    <Line d={DIAL_ART.major} tone="mid" />
    <Line d={DIAL_ART.zero} tone="hi" />
    <FaceText transform={DIAL_ART.label} size={3} tone="lo" anchor="middle">
      kg CO₂e
    </FaceText>
  </g>
);

const HUB = (
  <g key="hub">
    <Solid paths={DIAL_ART.hub} tone="mid" crease="none" />
    <Dots points={DIAL_ART.pin} size={0.5} tone="hi" />
  </g>
);

const POST = (
  <g key="post">
    <path className="iso-halo ck-soft" d={BODY_ART.topHalo} />
    <Solid paths={BODY_ART.postCollar} tone="mid" crease="faint" />
    <Solid paths={BODY_ART.post} tone="mid" crease="none" />
  </g>
);

const PAN = (
  <g key="pan">
    <Solid paths={PAN_ART.slab} tone="mid" crease="faint" />
    <Line d={PAN_ART.groove} tone="lo" />
    <Line d={PAN_ART.ribs} tone="faint" />
    <Dots points={PAN_ART.screws} size={0.45} tone="mid" />
  </g>
);

const SAMPLES = SAMPLE_ART.map((art, index) => (
  <g key={`sample-${index}`}>
    <path className="iso-halo ck-soft" d={art.halo} />
    {art.parts.map((part, at) => (
      <Solid key={at} paths={part.paths} tone={part.tone} crease={part.tone === "hi" ? "lo" : "faint"} />
    ))}
    <Line d={art.lines} tone="lo" />
    <Line d={art.faint} tone="faint" />
  </g>
));

const LABEL =
  "A shop dial scale that weighs carbon. A cast plinth on four feet carries a housing with vents, a label plate, a zero knob and a spirit level; a ribbed pan sits on a post above it and a round dial on the front reads 0 to 800 kg CO₂e. Samples of wall material are lowered onto the pan in turn: clay bricks, fly ash–lime bricks and an AAC block. The pan sinks a little under each and the needle swings to the carbon in one cubic metre of that wall.";

export function CarbonScaleArt({ samples }: { samples: ScaleSample[] }) {
  return <ScaleLive label={LABEL} samples={samples} base={BASE} body={BODY} dial={DIAL} hub={HUB} post={POST} pan={PAN} sampleArt={SAMPLES} />;
}

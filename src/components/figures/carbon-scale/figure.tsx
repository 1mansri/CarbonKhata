import { Plate } from "@/components/iso/react/draw";
import { TEMPLATES } from "@/data/lca/templates";
import { calculateProject } from "@/lib/lca/calculate";
import { createProject } from "@/lib/lca/project";
import { CarbonScaleArt } from "./art";
import { readoutOf, type ScaleSample } from "./model";
import "@/components/iso/iso.css";
import "./scale.css";

/** The three wall templates, weighed by the same engine as every project. */
const WALLS: { id: string; name: string; spoken: string }[] = [
  { id: "wall-clay-brick", name: "Clay brick", spoken: "1 cubic metre of clay brick wall" },
  { id: "wall-falg-brick", name: "Fly ash brick", spoken: "1 cubic metre of fly ash–lime brick wall" },
  { id: "wall-aac", name: "AAC block", spoken: "1 cubic metre of AAC block wall" },
];

const SAMPLES: ScaleSample[] = WALLS.map(({ id, name, spoken }) => {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) throw new Error(`Missing template ${id}`);
  return { name, spoken, kg: calculateProject(createProject(template.build())).total };
});

const kg = (index: number) => Math.round(SAMPLES[index]!.kg);

export function CarbonScaleFigure() {
  return (
    <div className="iso ck-iso" data-theme="light">
      <Plate
        fig="Fig 1"
        title="Carbon scale"
        hint="Tap for the next wall"
        readout={readoutOf(SAMPLES[0]!, SAMPLES[0]!.kg)}
        keys={[
          { mark: "lit", label: "Needle: kg CO₂e in 1 m³ of wall" },
          { mark: "raised", label: "The sample on the pan" },
        ]}
        caption={`1 m³ of wall, built to CPWD: clay brick ${kg(0)}, fly ash brick ${kg(1)}, AAC block ${kg(2)} kg CO₂e.`}
      >
        <CarbonScaleArt samples={SAMPLES} />
      </Plate>
    </div>
  );
}

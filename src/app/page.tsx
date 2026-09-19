import { Leaf } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <Leaf className="size-10 text-primary" />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Search activity data for LCA
      </h1>
      <p className="max-w-md text-muted-foreground">
        The activity search experience is coming next — this page will let
        you look up an activity and download its impact data.
      </p>
    </div>
  );
}

import { ProjectWorkspace } from "@/components/project/project-workspace";

export const metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/project/[id]">) {
  const { id } = await params;
  // Keyed so another project starts fresh (no carried-over draft or "new line" state).
  return <ProjectWorkspace key={id} id={id} />;
}

import { ProjectWorkspace } from "@/components/project/project-workspace";

export const metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/project/[id]">) {
  const { id } = await params;
  return <ProjectWorkspace id={id} />;
}

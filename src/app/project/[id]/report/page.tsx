import { PrintableReport } from "@/components/project/printable-report";

export const metadata = { title: "Report" };

export default async function ReportPage({ params }: PageProps<"/project/[id]/report">) {
  const { id } = await params;
  return <PrintableReport id={id} />;
}

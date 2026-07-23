import { DowntimeScreen } from "@/components/downtime-screen";

export default function DownPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  return <DowntimeScreen reason={searchParams?.reason} />;
}

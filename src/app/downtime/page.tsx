import { DowntimeScreen } from "@/components/downtime-screen";

export default function DowntimePage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  return <DowntimeScreen reason={searchParams?.reason} />;
}

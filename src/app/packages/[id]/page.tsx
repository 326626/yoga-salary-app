import { PackageDetailView } from "@/components/package-detail-view";

export default function PackageDetailPage({ params }: { params: { id: string } }) {
  return <PackageDetailView packageId={params.id} />;
}

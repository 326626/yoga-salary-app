import { StudioDetailView } from "@/components/studio-detail-view";

export default function StudioDetailPage({ params }: { params: { id: string } }) {
  return <StudioDetailView studioId={params.id} />;
}

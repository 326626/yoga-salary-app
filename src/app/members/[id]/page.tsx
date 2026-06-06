import { MemberDetailView } from "@/components/member-detail-view";

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  return <MemberDetailView memberId={params.id} />;
}

"use client";

import { useParams } from "next/navigation";
import { PollDetails } from "@/components/voting/PollDetails";
import { AppHero } from "@/components/ui/ui-layout";

export default function PollDetailPage() {
  const params = useParams();
  const pollAddress = params.pollAddress as string;

  return (
    <>
      <AppHero
        title="Poll Details"
        subtitle="View poll information and cast your vote"
      />
      
      <div className="container-main pb-16">
        <PollDetails pollAddress={pollAddress} />
      </div>
    </>
  );
} 
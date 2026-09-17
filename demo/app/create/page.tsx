import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Text } from "@/i18n/text";
import { CreateGuidance } from "@/components/create/create-guidance";
import { DemoCreateForm } from "../../components/create-form";

export default function DemoCreate() {
  return (
    <div className="create-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        <Text id="back_to_bounties" />
      </Link>
      <div className="create-intro">
        <h1>
          <Text id="create_a_new_bounty" />
        </h1>
        <p>
          <Text id="define_the_task_set_the_reward_let_good_work_happen" />
        </p>
      </div>
      <div className="create-layout">
        <DemoCreateForm />
        <CreateGuidance />
      </div>
    </div>
  );
}

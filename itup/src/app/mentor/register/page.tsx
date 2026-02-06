import { redirect } from "next/navigation";

// Force dynamic to ensure redirect works
export const dynamic = "force-dynamic";

export default function MentorRegisterPage() {
  redirect("/mentor/apply");
}

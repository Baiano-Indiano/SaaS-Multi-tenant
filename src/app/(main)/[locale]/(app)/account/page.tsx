import { redirect } from "@/i18n/routing";

export default function AccountPage() {
  redirect({ href: "/account/profile", locale: "en" });
}

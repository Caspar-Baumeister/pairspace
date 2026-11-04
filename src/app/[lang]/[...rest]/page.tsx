import { notFound } from "next/navigation";

/** Unknown paths inside a language still get the styled not found page. */
export default function UnknownPage() {
  notFound();
}

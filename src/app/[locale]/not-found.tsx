import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl font-bold">404</h1>
      <Link href="/" className="underline">Golf Deals</Link>
    </div>
  );
}

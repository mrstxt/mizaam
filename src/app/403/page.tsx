import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="apple-card p-10 max-w-lg text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold tracking-tight">Ruxsat yo'q</h1>
        <p className="text-sm text-black/45 mt-2">
          Bu panelga kirish uchun sizga admin tomonidan ruxsat berilishi kerak.
        </p>
        <Link href="/" className="apple-btn mt-6">Bosh sahifaga qaytish</Link>
      </div>
    </div>
  );
}

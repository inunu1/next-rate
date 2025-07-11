'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/user-management">
          <div className="p-6 bg-white rounded-lg shadow hover:bg-blue-100 transition cursor-pointer text-center">
            ユーザー管理画面
          </div>
        </Link>
        <Link href="/dashboard/member-management">
          <div className="p-6 bg-white rounded-lg shadow hover:bg-green-100 transition cursor-pointer text-center">
            会員管理画面
          </div>
        </Link>
        <Link href="/dashboard/match-management">
          <div className="p-6 bg-white rounded-lg shadow hover:bg-yellow-100 transition cursor-pointer text-center">
            勝敗管理画面
          </div>
        </Link>
      </div>
    </main>
  );
}

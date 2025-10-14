'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>

      {/* ユーザー管理画面を中央に配置 */}
      <div className="flex justify-center mb-12">
        <Link href="/dashboard/user-management">
          <div className="p-6 bg-white rounded-lg shadow hover:bg-blue-100 transition cursor-pointer text-center w-64">
            ユーザー管理画面
          </div>
        </Link>
      </div>

      {/* その他のリンクはグリッドで表示 */}
      <div className="grid gap-6 md:grid-cols-2">
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
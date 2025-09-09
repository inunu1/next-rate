// src/app/login/page.tsx
"use client"; // このファイルをクライアントコンポーネントとして扱う宣言

import { useState } from "react"; // Reactの状態管理フックをインポート
import { signIn } from "next-auth/react"; // NextAuthのサインイン関数をインポート
import { useRouter } from "next/navigation"; // Next.jsのルーターをインポート（画面遷移用）

export default function LoginPage() { // ログインページのコンポーネント定義
  const [email, setEmail] = useState(""); // emailの状態を管理
  const [password, setPassword] = useState(""); // passwordの状態を管理
  const router = useRouter(); // ルーターを初期化（リダイレクトなどで利用）

  const handleLogin = async (e: React.FormEvent) => { // フォーム送信時の処理
    e.preventDefault(); // ページリロードを防止

    // NextAuthのcredentialsプロバイダーでサインインを試みる
    const res = await signIn("credentials", {
      email, // 入力されたメールアドレス
      password, // 入力されたパスワード
      redirect: false, // 自動リダイレクトを無効化（手動でrouter.pushを使う）
    });

    if (res?.ok) { // サインイン成功時
      router.push("/dashboard"); // ダッシュボードに遷移
    } else { // サインイン失敗時
      alert("ログインに失敗しました"); // エラーメッセージを表示
    }
  };

  return (
    // ログインフォームの全体を囲むコンテナ
    <div className="max-w-md mx-auto mt-20 p-4 border rounded">
      {/* 見出し */}
      <h1 className="text-2xl font-bold mb-4">ログイン</h1>
      {/* フォーム */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email入力欄 */}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email" // email入力用
            className="w-full border px-3 py-2 rounded" // 幅100%、枠線、内側余白、角丸
            value={email} // useStateのemailをバインド
            onChange={(e) => setEmail(e.target.value)} // 入力が変わるたびに状態更新
            required // 必須入力
          />
        </div>
        {/* Password入力欄 */}
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password" // パスワード入力用（●●で表示）
            className="w-full border px-3 py-2 rounded"
            value={password} // useStateのpasswordをバインド
            onChange={(e) => setPassword(e.target.value)} // 入力が変わるたびに状態更新
            required
          />
        </div>
        {/* ログインボタン */}
        <button
          type="submit" // フォーム送信ボタン
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600" 
          // 幅100%、青背景、白文字、上下余白、角丸、ホバー時に濃い青
        >
          ログイン
        </button>
      </form>
    </div>
  );
}

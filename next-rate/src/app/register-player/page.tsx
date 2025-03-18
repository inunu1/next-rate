"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    rating: "",
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // フォームの変更処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // レートが数値かどうかチェック
    if (isNaN(Number(formData.rating)) || Number(formData.rating) < 0) {
      setError("Rating must be a valid positive number.");
      return;
    }

    const res = await fetch("/api/register-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        rating: Number(formData.rating), // 数値変換
      }),
    });

    if (res.ok) {
      router.push("/players"); // 登録後プレイヤー一覧ページへ
    } else {
      const data = await res.json();
      setError(data.message || "Registration failed.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Player</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Player Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />

          {/* Rating */}
          <input
            type="number"
            name="rating"
            placeholder="Initial Rating"
            value={formData.rating}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Register Player
          </button>
        </form>
      </div>
    </div>
  );
}

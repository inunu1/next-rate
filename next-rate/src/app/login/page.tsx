"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      alert("ログインに失敗しました");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ログイン画面</h1>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
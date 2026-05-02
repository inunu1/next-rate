"use client";

/**
 * ============================================================================
 * 【画面名称】
 * 対局者管理画面（PlayersClient）
 *
 * 【機能概要】
 * ・団体（userId）に紐づくプレイヤーの検索・登録・削除を行う。
 *
 * 【設計方針】
 * ① admin（団体オーナー）
 *      - 自団体のみ操作可能
 *      - 団体選択 UI は表示しない
 *
 * ② owner（SaaS 運営者）
 *      - 団体選択 UI を表示し、選択した団体のプレイヤーを操作する
 *
 * ③ usePlayers フックは userId を受け取り、API 呼び出し時に userId を付与する
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Players.module.css";

import Select from "@/components/Select/Select";
import AppButton from "@/components/Button/Button";
import PageHeader from "@/components/PageHeader/PageHeader";
import FormBar from "@/components/FormBar/FormBar";

import { usePlayers } from "./usePlayers";

type Option = { label: string; value: string };

export default function PlayersClient({
  currentUserId,
  role,
  allUsers,
}: {
  currentUserId: string;
  role: "owner" | "admin";
  allUsers?: { id: string; name: string }[];
}) {
  const [selectedUser, setSelectedUser] = useState<Option>({
    label: "自団体",
    value: currentUserId,
  });

  const P = usePlayers(selectedUser.value);

  useEffect(() => {
    P.init();
  }, [P.init]);

  if (!P.mounted) return null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="対局者管理"
        actions={
          <Link href="/dashboard" className={styles.backLink}>
            ← ダッシュボードへ戻る
          </Link>
        }
      />

      {role === "owner" && allUsers && (
        <div className={styles.orgSelector}>
          <Select
            options={allUsers.map((u) => ({ label: u.name, value: u.id }))}
            value={selectedUser}
            onChange={(opt) => opt && setSelectedUser(opt)}
            width={260}
          />
        </div>
      )}

      {/* 登録フォーム */}
      <div className={styles.formCard}>
        <FormBar
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            P.handleRegister();
          }}
        >
          <input
            className={styles.input}
            placeholder="プレイヤー名"
            value={P.name}
            onChange={(e) => P.setName(e.target.value)}
          />

          <input
            className={styles.input}
            placeholder="初期レート"
            type="number"
            value={P.initialRate}
            onChange={(e) => P.setInitialRate(e.target.value)}
          />

          <AppButton variant="primary" size="md" type="submit">
            登録
          </AppButton>
        </FormBar>
      </div>

      {/* 一覧 */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>名前</th>
                <th>レート</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {P.players.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.currentRate}</td>
                  <td>
                    <AppButton
                      variant="danger"
                      size="md"
                      onClick={() => P.handleDelete(p.id)}
                    >
                      削除
                    </AppButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

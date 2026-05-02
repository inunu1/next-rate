"use client";

/**
 * ============================================================================
 * 【画面名称】
 * 対局者管理画面（PlayersClient）
 *
 * 【機能概要】
 * ・団体（userId）に紐づくプレイヤーの登録・一覧・削除を行う。
 *
 * 【設計方針】
 * ① admin：自団体のみ操作
 * ② owner：団体選択 UI を表示し、選択団体を操作
 * ③ usePlayers は userId を受け取り、API に userId を付与
 * ④ UI は ResultsClient とデザインを統一
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Players.module.css";

import Select from "@/components/Select/Select";
import Table from "@/components/Table/Table";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";

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
  // ---------------------------------------------------------------------------
  // 団体選択（owner のみ有効）
  // ---------------------------------------------------------------------------
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
      {/* ------------------------------------------------------------
       * ヘッダー
       * ------------------------------------------------------------ */}
      <PageHeader
        title="対局者管理"
        actions={
          <Link href="/dashboard" className={styles.backLink}>
            ← ダッシュボードへ戻る
          </Link>
        }
      />

      {/* ------------------------------------------------------------
       * owner のみ団体選択
       * ------------------------------------------------------------ */}
      {role === "owner" && allUsers && (
        <div className={styles.orgSelector}>
          <Select
            options={allUsers.map((u) => ({
              label: u.name,
              value: u.id,
            }))}
            value={selectedUser}
            onChange={(opt) => opt && setSelectedUser(opt)}
            width={260}
          />
        </div>
      )}

      {/* ------------------------------------------------------------
       * プレイヤー登録フォーム（ResultsClient と同系統のカード＋FormBar）
       * ------------------------------------------------------------ */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>プレイヤー新規登録</div>

        <FormBar
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            P.handleRegister();
          }}
        >
          <input
            className={styles.textInput}
            type="text"
            placeholder="プレイヤー名"
            value={P.name}
            onChange={(e) => P.setName(e.target.value)}
          />

          <input
            className={styles.numberInput}
            type="number"
            placeholder="初期レート"
            value={P.initialRate}
            onChange={(e) => P.setInitialRate(e.target.value)}
          />

          <AppButton variant="primary" size="md" type="submit">
            登録
          </AppButton>
        </FormBar>
      </div>

      {/* ------------------------------------------------------------
       * プレイヤー一覧テーブル（ResultsClient と同じテーブル構造に寄せる）
       * ------------------------------------------------------------ */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <Table
            className={styles.table}
            rows={P.players}
            columns={[
              {
                header: "名前",
                render: (p) => p.name,
              },
              {
                header: "レート",
                render: (p) => p.currentRate,
              },
              {
                header: "操作",
                render: (p) => (
                  <AppButton
                    variant="danger"
                    size="md"
                    onClick={() => P.handleDelete(p.id)}
                  >
                    削除
                  </AppButton>
                ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';

export default function AccessPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(true);
        return;
      }
      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
      window.location.assign(safeNext);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
          NaviDash
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">私人主页访问保护</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          输入部署者设置的访问密码。
        </p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          autoComplete="current-password"
          className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          placeholder="访问密码"
        />
        {error && <p className="mt-2 text-sm text-red-600">密码错误，请重试。</p>}
        <button
          type="submit"
          disabled={!password || submitting}
          className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? '正在验证…' : '进入主页'}
        </button>
      </form>
    </main>
  );
}

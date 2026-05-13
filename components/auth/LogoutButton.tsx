"use client";

export function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button type="submit" className="btn-ghost" data-testid="logout">
        Keluar
      </button>
    </form>
  );
}

import { TasksWorkspace } from "@/components/tugasku/TasksWorkspace";

export const metadata = { title: "Tugas · TugasKu" };

export default function TasksPage() {
  return (
    <div className="space-y-6 py-8">
      <header className="space-y-1">
        <span className="badge">TugasKu · Tugas</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Tugasmu
        </h1>
        <p className="text-ink-300">
          Local-first — datamu hidup di perangkatmu, sinkron ke akun jika kamu
          login.
        </p>
      </header>
      <TasksWorkspace />
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import type { Task } from "../types/task";
import { createTask, deleteTask, listTasks, updateTask } from "../services/taskService";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    listTasks().then(setTasks);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const task = await createTask(title.trim());
    setTasks((prev) => [...prev, task]);
    setTitle("");
  }

  async function handleToggle(task: Task) {
    const updated = await updateTask(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleDelete(id: number) {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded border border-slate-700 bg-slate-900 p-2"
          placeholder="Nova task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="rounded bg-emerald-600 px-3 py-1">Adicionar</button>
      </form>
      <ul className="space-y-2 rounded border border-slate-700 bg-slate-900/50 p-4">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={t.done} onChange={() => handleToggle(t)} />
            <span className={`flex-1 ${t.done ? "text-slate-500 line-through" : ""}`}>{t.title}</span>
            <button onClick={() => handleDelete(t.id)} className="text-sm text-red-400 hover:text-red-300">
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

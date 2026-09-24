import type { Task } from "../types/task";
import { api } from "./api";

export async function listTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks");
  return data;
}

export async function createTask(title : string): Promise<Task> {
  const { data } = await api.post<Task>("/tasks", { title });
  return data;
}
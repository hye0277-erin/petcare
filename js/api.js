const OFFLINE_MESSAGE = 'Backend connection is temporarily disabled.';

export async function listTasksByDate() {
  return [];
}

export async function createTask() {
  throw new Error(OFFLINE_MESSAGE);
}

export async function setTaskDone() {
  throw new Error(OFFLINE_MESSAGE);
}

export async function updateTask() {
  throw new Error(OFFLINE_MESSAGE);
}

export async function deleteTask() {
  throw new Error(OFFLINE_MESSAGE);
}

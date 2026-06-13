// ===== Supabase 데이터 접근 (care_tasks) =====
// 모든 함수는 로그인한 사용자 기준. (RLS가 user_id로 자동 필터)
// import { listTasksByDate, createTask, setTaskDone, updateTask, deleteTask } from './api.js';

import { supabase } from './config.js';
import { getUser } from './auth.js';

const TABLE = 'care_tasks';

// ---- 날짜별 일정 조회 (date: 'YYYY-MM-DD') ----
export async function listTasksByDate(date) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('task_date', date)
    .order('is_time_sensitive', { ascending: false }) // 시간 일정 먼저
    .order('scheduled_time', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ---- 케어 일정 등록 ----
// task: { task_date, icon, name, category, is_time_sensitive, scheduled_time, bg, memo }
export async function createTask(task) {
  const user = await getUser();
  if (!user) throw new Error('로그인이 필요해요.');
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...task, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- 완료 / 미완료 체크 ----
export async function setTaskDone(id, done, doneTime) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ done, done_time: done ? doneTime : null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- 일정 수정 (부분 업데이트) ----
export async function updateTask(id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- 일정 삭제 ----
export async function deleteTask(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/**
 * Job Queue — KV-backed async job system
 *
 * Jobs are stored as KV entries with status tracking.
 * The frontend polls for completion.
 * Results are stored as versioned analysis cache entries.
 */

import { kv } from "@vercel/kv";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  deal_id: string;
  type: "meeting_prep" | "action_plan" | "frank_analysis" | "medpicc_recompute";
  status: JobStatus;
  created_at: string;
  completed_at?: string;
  error?: string;
  result_version?: number;
}

const JOB_PREFIX = "job:";
const JOB_TTL = 60 * 60; // 1 hour TTL for job records

/**
 * Create a new job. Returns the job record.
 */
export async function createJob(
  dealId: string,
  type: Job["type"]
): Promise<Job> {
  const id = `${dealId}:${type}:${Date.now()}`;
  const job: Job = {
    id,
    deal_id: dealId,
    type,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  await kv.set(`${JOB_PREFIX}${id}`, job, { ex: JOB_TTL });
  // Also store as "latest job" for this deal+type for easy lookup
  await kv.set(`${JOB_PREFIX}latest:${dealId}:${type}`, job, { ex: JOB_TTL });
  return job;
}

/**
 * Update job status.
 */
export async function updateJob(
  jobId: string,
  update: Partial<Pick<Job, "status" | "completed_at" | "error" | "result_version">>
): Promise<void> {
  const job = await kv.get<Job>(`${JOB_PREFIX}${jobId}`);
  if (!job) return;
  const updated = { ...job, ...update };
  await kv.set(`${JOB_PREFIX}${jobId}`, updated, { ex: JOB_TTL });
  await kv.set(`${JOB_PREFIX}latest:${job.deal_id}:${job.type}`, updated, { ex: JOB_TTL });
}

/**
 * Get the latest job for a deal+type.
 */
export async function getLatestJob(
  dealId: string,
  type: Job["type"]
): Promise<Job | null> {
  return kv.get<Job>(`${JOB_PREFIX}latest:${dealId}:${type}`);
}

/**
 * Get a specific job by ID.
 */
export async function getJob(jobId: string): Promise<Job | null> {
  return kv.get<Job>(`${JOB_PREFIX}${jobId}`);
}

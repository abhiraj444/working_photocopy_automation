/**
 * Job state management - in-memory storage and lifecycle
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { UserJob, JobFile, JobState } from './types';
import { CONFIG } from './config';
import { logger } from './logger';

// In-memory storage for active jobs
export const activeJobs = new Map<string, UserJob>();

/**
 * Create a new job for a user
 */
export function createJob(phoneNumber: string): UserJob {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CONFIG.JOB_RETENTION_HOURS * 60 * 60 * 1000);

    const job: UserJob = {
        phoneNumber,
        state: 'PENDING',
        files: [],
        filesExcluded: [],
        createdAt: now,
        expiresAt,
        layout: undefined  // Layout selection (1/2/4)
    };

    activeJobs.set(phoneNumber, job);
    logger.info({ phoneNumber, expiresAt }, 'Created new job');

    return job;
}

/**
 * Get existing job or undefined
 */
export function getJob(phoneNumber: string): UserJob | undefined {
    return activeJobs.get(phoneNumber);
}

/**
 * Get existing job or create new one
 */
export function getOrCreateJob(phoneNumber: string): UserJob {
    const existing = activeJobs.get(phoneNumber);

    if (existing) {
        // If job was completed/cancelled, reset it
        if (existing.state === 'COMPLETED' || existing.state === 'CANCELLED') {
            logger.info({ phoneNumber }, 'Resetting completed job');
            return createJob(phoneNumber);
        }
        return existing;
    }

    return createJob(phoneNumber);
}

/**
 * Update job state
 */
export function updateJobState(phoneNumber: string, newState: JobState): void {
    const job = activeJobs.get(phoneNumber);
    if (!job) {
        logger.warn({ phoneNumber }, 'Cannot update state - job not found');
        return;
    }

    const oldState = job.state;
    job.state = newState;

    logger.info({ phoneNumber, oldState, newState }, 'Updated job state');
}

/**
 * Add file to job
 */
export function addFileToJob(phoneNumber: string, file: JobFile): void {
    const job = getOrCreateJob(phoneNumber);

    job.files.push(file);

    logger.info({
        phoneNumber,
        fileName: file.fileName,
        totalFiles: job.files.length
    }, 'Added file to job');
}

/**
 * Delete job and cleanup files
 */
export async function deleteJob(phoneNumber: string): Promise<void> {
    const job = activeJobs.get(phoneNumber);
    if (!job) {
        return;
    }

    // Delete from memory
    activeJobs.delete(phoneNumber);

    // Delete downloads folder
    const downloadDir = path.join(CONFIG.DOWNLOAD_PATH, phoneNumber);
    try {
        await fs.rm(downloadDir, { recursive: true, force: true });
        logger.info({ phoneNumber, dir: downloadDir }, 'Deleted download folder');
    } catch (error) {
        logger.warn({ error, phoneNumber, dir: downloadDir }, 'Failed to delete download folder');
    }

    // Delete processed folder
    const processedDir = path.join(CONFIG.PROCESSED_PATH, phoneNumber);
    try {
        await fs.rm(processedDir, { recursive: true, force: true });
        logger.info({ phoneNumber, dir: processedDir }, 'Deleted processed folder');
    } catch (error) {
        logger.warn({ error, phoneNumber, dir: processedDir }, 'Failed to delete processed folder');
    }

    logger.info({ phoneNumber }, 'Deleted job');
}

/**
 * Cleanup expired jobs (runs every hour)
 * Deletes jobs older than JOB_RETENTION_HOURS
 */
export async function cleanupExpiredJobs(): Promise<void> {
    const now = new Date();
    const expiredJobs: string[] = [];

    for (const [phoneNumber, job] of activeJobs.entries()) {
        if (now > job.expiresAt) {
            expiredJobs.push(phoneNumber);
        }
    }

    if (expiredJobs.length > 0) {
        logger.info({ count: expiredJobs.length }, 'Cleaning up expired jobs');

        for (const phoneNumber of expiredJobs) {
            await deleteJob(phoneNumber);
        }
    }
}

/**
 * Start automatic cleanup interval (every hour)
 */
export function startCleanupInterval(): void {
    const intervalMs = 60 * 60 * 1000;  // 1 hour

    setInterval(async () => {
        await cleanupExpiredJobs();
    }, intervalMs);

    logger.info({
        intervalHours: 1,
        retentionHours: CONFIG.JOB_RETENTION_HOURS
    }, 'Started cleanup interval');
}

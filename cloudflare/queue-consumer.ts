// cloudflare/queue-consumer.ts
// Queue Consumer for background job processing

import { D1Database, KVNamespace, Queue } from '@cloudflare/workers-types';
import { AlertService } from './services/db/alert.service';
import { MetricsService } from './services/db/metrics.service';
import { WorkService } from './services/db/work.service';

export interface QueueMessage {
  type: 'alert_check' | 'metrics_update' | 'email_send' | 'work_import';
  payload: any;
}

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  JOBS_QUEUE: Queue;
}

/**
 * Process alert checks
 */
async function processAlertCheck(payload: any, env: Env): Promise<void> {
  const alertService = new AlertService(env.DB);
  const metricsService = new MetricsService(env.DB);

  const { alertId, workId } = payload;

  // Get alert details
  const alerts = await alertService.getByWorkId(workId, true);

  if (alerts.length === 0) {
    return;
  }

  // Get latest metrics for the work
  const latestMetric = await metricsService.getLatestByWorkId(workId);

  if (!latestMetric) {
    return;
  }

  // Check each alert's threshold
  for (const alert of alerts) {
    if (!alert.threshold_value || !alert.alert_type) continue;

    let shouldTrigger = false;

    switch (alert.alert_type) {
      case 'trend_score':
        shouldTrigger = latestMetric.trend_score >= alert.threshold_value;
        break;
      case 'monetization_potential':
        shouldTrigger = latestMetric.monetization_potential >= alert.threshold_value;
        break;
      case 'demand_score':
        shouldTrigger = latestMetric.demand_score >= alert.threshold_value;
        break;
      case 'search_volume':
        shouldTrigger = latestMetric.search_volume >= alert.threshold_value;
        break;
    }

    if (shouldTrigger) {
      // Queue email notification
      await env.JOBS_QUEUE.send({
        type: 'email_send',
        payload: {
          alertId: alert.id,
          userId: alert.user_id,
          workId: alert.work_id,
          alertType: alert.alert_type,
          currentValue: (latestMetric as any)[alert.alert_type],
          threshold: alert.threshold_value,
        },
      });
    }
  }
}

/**
 * Process metrics updates
 */
async function processMetricsUpdate(payload: any, env: Env): Promise<void> {
  const metricsService = new MetricsService(env.DB);
  const workService = new WorkService(env.DB);

  const { workId } = payload;

  // Get work details
  const work = await workService.findById(workId);

  if (!work) {
    return;
  }

  // In a real implementation, you would:
  // 1. Fetch Google Trends data
  // 2. Check Amazon sales rank
  // 3. Calculate competition score
  // 4. Update metrics in database

  // For now, create a placeholder metric
  await metricsService.create({
    work_id: workId,
    search_volume: 0,
    trend_score: 0.0,
    competition_score: 0.0,
    demand_score: 0.0,
    monetization_potential: 0.0,
  });

  console.log(`Metrics updated for work ${workId}`);
}

/**
 * Process email sending
 */
async function processEmailSend(payload: any, env: Env): Promise<void> {
  // In a real implementation, you would use an email service
  // For now, just log the email
  console.log('Email to be sent:', payload);

  // You could integrate with:
  // - SendGrid
  // - Mailgun
  // - Resend
  // - Cloudflare Email Workers
}

/**
 * Process work import from external sources
 */
async function processWorkImport(payload: any, env: Env): Promise<void> {
  const workService = new WorkService(env.DB);

  const { sourceWork, userId } = payload;

  // Check if work already exists
  const existingWorks = await workService.search(sourceWork.title, 1);

  if (existingWorks.length > 0) {
    console.log(`Work "${sourceWork.title}" already exists`);
    return;
  }

  // Create work from external source
  await workService.create({
    title: sourceWork.title,
    author: sourceWork.author,
    original_publication_year: sourceWork.publication_year,
    public_domain_year: sourceWork.public_domain_year,
    description: sourceWork.description,
    source_url: sourceWork.source_url,
    download_url: sourceWork.download_url,
    media_type: sourceWork.media_type,
    language: sourceWork.language,
    metadata: sourceWork.metadata,
    user_id: userId,
  });

  console.log(`Imported work "${sourceWork.title}" from ${sourceWork.source}`);
}

/**
 * Main queue consumer handler
 */
export async function handleQueue(
  batch: MessageBatch<QueueMessage>,
  env: Env
): Promise<void> {
  for (const message of batch.messages) {
    try {
      const { type, payload } = message.body;

      switch (type) {
        case 'alert_check':
          await processAlertCheck(payload, env);
          break;

        case 'metrics_update':
          await processMetricsUpdate(payload, env);
          break;

        case 'email_send':
          await processEmailSend(payload, env);
          break;

        case 'work_import':
          await processWorkImport(payload, env);
          break;

        default:
          console.warn(`Unknown queue message type: ${type}`);
      }

      // Acknowledge successful processing
      message.ack();
    } catch (error) {
      console.error('Error processing queue message:', error);
      // Message will be retried or sent to DLQ based on configuration
      message.retry();
    }
  }
}

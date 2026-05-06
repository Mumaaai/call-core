import { Worker } from 'bullmq';

const worker = new Worker('processingQueue', async job => {
  console.log(`Processing job ${job.id}`);
  // TODO: Add worker logic
}, {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

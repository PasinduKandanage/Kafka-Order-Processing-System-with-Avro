const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-system',
  brokers: ['localhost:9092'],
  retry: {
    retries: 8,
    initialRetryTime: 100,
    maxRetryTime: 30000
  }
});

const TOPICS = {
  ORDERS: 'orders',
  DLQ: 'orders-dlq'
};

module.exports = { kafka, TOPICS };
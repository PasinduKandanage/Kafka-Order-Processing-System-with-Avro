const { kafka, TOPICS } = require('./config/kafka');
const avro = require('avsc');
const fs = require('fs');
const path = require('path');

// Load Avro schema
const schema = avro.Type.forSchema(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'schemas/order.avsc'), 'utf8'))
);

const consumer = kafka.consumer({ groupId: 'order-processor' });
const dlqProducer = kafka.producer();

// State for aggregation
let totalPrice = 0;
let orderCount = 0;

// Retry configuration
const MAX_RETRIES = 3;
const retryMap = new Map(); // Track retry attempts

async function processOrder(order, retryCount = 0) {
  // Simulate random failures (10% chance)
  const shouldFail = Math.random() < 0.1;

  if (shouldFail && retryCount < MAX_RETRIES) {
    throw new Error('Temporary processing failure');
  }

  if (shouldFail && retryCount >= MAX_RETRIES) {
    throw new Error('Permanent failure - moving to DLQ');
  }

  // Process successfully
  totalPrice += order.price;
  orderCount++;
  const runningAverage = (totalPrice / orderCount).toFixed(2);

  console.log(`Processed: ${order.orderId} - ${order.product} - $${order.price}`);
  console.log(`Running Average: $${runningAverage} (Total Orders: ${orderCount})`);
}

async function sendToDLQ(order, error) {
  try {
    await dlqProducer.send({
      topic: TOPICS.DLQ,
      messages: [{
        key: order.orderId,
        value: JSON.stringify({
          order,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }]
    });
    console.log(`Sent to DLQ: ${order.orderId} - ${error.message}`);
  } catch (dlqError) {
    console.error('Failed to send to DLQ:', dlqError);
  }
}

async function run() {
  await consumer.connect();
  await dlqProducer.connect();
  console.log('Consumer connected');

  await consumer.subscribe({ topic: TOPICS.ORDERS, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        // Deserialize with Avro
        const order = schema.fromBuffer(message.value);
        const orderKey = order.orderId;

        // Get retry count
        const retryCount = retryMap.get(orderKey) || 0;

        try {
          await processOrder(order, retryCount);
          // Clear retry count on success
          retryMap.delete(orderKey);
        } catch (error) {
          if (retryCount < MAX_RETRIES) {
            // Retry logic
            retryMap.set(orderKey, retryCount + 1);
            console.log(`🔄 Retry ${retryCount + 1}/${MAX_RETRIES} for ${orderKey}: ${error.message}`);
            
            // Simulate retry delay
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            
            // Retry processing
            try {
              await processOrder(order, retryCount + 1);
              retryMap.delete(orderKey);
            } catch (retryError) {
              // Will be handled in next message processing
            }
          } else {
            // Send to DLQ after max retries
            await sendToDLQ(order, error);
            retryMap.delete(orderKey);
          }
        }
      } catch (error) {
        console.error('Message processing error:', error);
      }
    }
  });
}

run().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await consumer.disconnect();
  await dlqProducer.disconnect();
  process.exit(0);
});



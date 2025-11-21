const { kafka, TOPICS } = require('./config/kafka');
const avro = require('avsc');
const fs = require('fs');
const path = require('path');

// Load Avro schema
const schema = avro.Type.forSchema(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'schemas/order.avsc'), 'utf8'))
);

const producer = kafka.producer();

const products = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Mouse', 'Keyboard'];

async function produceOrders() {
  await producer.connect();
  console.log('Producer connected');

  let orderCounter = 1;

  setInterval(async () => {
    const order = {
      orderId: `ORD-${orderCounter.toString().padStart(4, '0')}`,
      product: products[Math.floor(Math.random() * products.length)],
      price: parseFloat((Math.random() * 1000 + 10).toFixed(2))
    };

    try {
      // Serialize with Avro
      const serializedOrder = schema.toBuffer(order);

      await producer.send({
        topic: TOPICS.ORDERS,
        messages: [{
          key: order.orderId,
          value: serializedOrder
        }]
      });

      console.log(`Produced: ${order.orderId} - ${order.product} - $${order.price}`);
      orderCounter++;
    } catch (error) {
      console.error('Production error:', error);
    }
  }, 2000); // Send every 2 seconds
}

produceOrders().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await producer.disconnect();
  process.exit(0);
});
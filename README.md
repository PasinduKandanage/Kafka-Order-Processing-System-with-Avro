# Kafka-Order-Processing-System-with-Avro
A robust, production-ready order processing system built with Apache Kafka and Node.js, featuring Avro serialization, retry logic, dead letter queue (DLQ), and real-time price aggregation.

🎯 Overview
This project implements a distributed order processing system that demonstrates key concepts in event-driven architecture. The system consists of a producer that generates random order messages and a consumer that processes these orders while maintaining a running average of prices.
Key Highlights

- Event Streaming: Uses Apache Kafka for reliable message delivery
- Data Serialization: Implements Avro schema for efficient binary encoding
- Fault Tolerance: Automatic retry mechanism with exponential backoff
- Error Handling: Dead Letter Queue for permanently failed messages
- Real-time Analytics: Calculates the running average of order prices
- Production Ready: Graceful shutdown and proper error handling

✨ Features
1. Avro Serialization

- Compact binary format for efficient data transfer
- Schema validation ensures data integrity
- Forward and backward compatibility support

2. Retry Logic

- Automatic retry for transient failures
- Configurable retry attempts (default: 3)
- Exponential backoff strategy (1s, 2s, 3s)

3. Dead Letter Queue (DLQ)

- Captures permanently failed messages
- Preserves error information and timestamp
- Enables post-mortem analysis

4. Real-time Aggregation

- Maintains a running average of all order prices
- Updates with each successfully processed order
- Displays total order count

5. Graceful Shutdown

- Proper connection cleanup on SIGINT
- Ensures no message loss during shutdown


📁 Project Structure
kafka-order-system/
├── config/
│   └── kafka.js              # Kafka configuration and topic definitions
├── schemas/
│   └── order.avsc            # Avro schema for order messages
├── producer.js               # Order message producer
├── consumer.js               # Order message consumer with retry & DLQ
├── docker-compose.yml        # Kafka infrastructure setup
├── package.json              # Node.js dependencies
├── .gitignore              
└── README.md               

🔧 How It Works
-- Producer Flow

- Connects to Kafka broker
- Loads Avro schema from schemas/order.avsc
- Generates random orders every 2 seconds:

- Random product from predefined list
- Random price between $10 and $1010
- Sequential order ID (ORD-0001, ORD-0002, etc.)


- Serializes order using Avro
- Sends to orders topic

-- Consumer Flow

- Connects to Kafka broker and subscribes to orders topic
- Receives and deserializes messages using Avro
- Processes each order:

- Success: Updates running average and displays result
- Temporary Failure (10% random): Retries up to 3 times with delays
- Permanent Failure: Sends to DLQ after max retries


- Maintains state for price aggregation

🙏 Acknowledgments

- Apache Kafka documentation
- KafkaJS library maintainers

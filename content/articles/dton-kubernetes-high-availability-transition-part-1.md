---
title: "dTON Kubernetes High Availability Transition, part 1"
description: "How dTON moved its Kubernetes-based TON data infrastructure to a high availability bare-metal cluster."
publishedAt: "2025-03-13"
author: "Andrey Tvorozhkov"
sourceUrl: "https://blog.dton.io/dton-kubernetes-high-availability-transition-part-1/"
---

During the last year all dTON services were running on a Kubernetes cluster without an HA build. Sometimes when we lost servers, we faced complex problems.

To improve the stability and availability of the service, we developed a high availability dTON cluster that will continue to work even if some of the servers are unavailable. Additionally, we set up a complex monitoring and alerting system for services and data consistency.

Today we managed to switch all our services to the HA cluster.

In this article, we want to share our experience of HA cluster on top of bare-metal servers in three parts:

1. dTON Kubernetes High Availability Transition
2. dTON LiteServers High Availability Transition
3. dTON GraphQL High Availability Transition

Second and third parts will be posted exclusively on @dtontech with promo codes on dTON API usage.

## Kubernetes HA

The first thing we did was configure Kubernetes HA, following the documentation for the stacked etcd topology.

Hetzner Load Balancer checks the liveness of Kubernetes API nodes and balances traffic between live servers.

This is one of the simplest and most important steps. If you do not run Kubernetes in HA mode, and a control-plane node crashes, the whole cluster falls apart, causing all services that communicate on the Kubernetes network to crash.

Also, if you initially set up Kubernetes not in HA mode, you cannot upgrade it to HA without downtime.

In HA mode, you are limited only by the number of control-plane nodes behind the load balancer. In our case it is 3 nodes, and if any of them crash we can quickly add more control-plane nodes, allowing our cluster to function during datacenter problems.

## dTON Architecture

To pick the right HA infrastructure, let's break down the key components of dTON on which our TON index runs:

- Custom TON nodes: patched nodes with many changes, including sending parsed blocks into Kafka.
- Kafka: collects information from liteservers, lite-balancers, TON nodes, and sends it to other services.
- C++ / Python parsers and emulator services: for each shard we run a service that indexes and emulates all network transactions and stores them in ClickHouse / PostgreSQL / Redis.
- Python API server: converts GraphQL and REST requests to database requests.
- ClickHouse: the main database for transactions and blocks. The archive index size is currently 10 TB.
- PostgreSQL: a top-level database that contains metrics and small tables for quick data access.
- Redis: gives account states quickly to index following blocks and event traces.

In addition to this, the following components are worth highlighting:

- LiteServer balancers for HA access to live TON liteservers.
- GitHub Actions workers for our custom library builds.
- Prometheus and Alertmanager for metric collection, status page, and alerts to lovely Telegram chats.
- Grafana.
- Private Docker registry.
- Airflow.
- Nginx Ingress.
- GitLab.

We also have a number of components for providing different services, but we will tell you about them sometime later.

## Nginx Ingress HA

The first component of the system through which everything will work is nginx-ingress. It allows us to distribute load among servers, automatically receive and renew HTTPS certificates, and so on.

Naturally, this component should work behind a third-party load balancer that will monitor liveness and do failover, so traffic always gets only to live nodes.

We created several nginx-ingress controllers according to the documentation and hid them behind a Cloudflare load balancer, which implements everything needed to ensure that the service remains available.

## Django

Before the upgrade, we were using gunicorn with Django processes. This consumed a lot of RAM because GraphQL queries could run for 15-20 seconds, so we needed to keep many processes running.

We rewrote all API methods to async libraries and achieved faster responses, as well as a 60% reduction in RAM consumption.

## Docker Registry HA

Setting up a private Docker registry turned out to be a bit more complicated. The point is that in most approaches, docker-registry relies on PersistentVolume in S3 or other cloud providers. That makes it possible to run it on different servers with binding to one drive.

For us, this solution is not suitable because we have bare-metal servers and PersistentVolume is bound to a specific server.

The registry must be in HA build because if it is unavailable, a Kubernetes pod will not be able to start. It will not be able to check image hashes or download new ones.

To solve this problem, we set up 3 different Docker registries:

- `first.private_registry.svc.cluster.local`
- `second.private_registry.svc.cluster.local`
- `third.private_registry.svc.cluster.local`

When building the Docker image, we upload the image into all three Docker registries.

At the same time all images are downloaded from `private_registry.svc.cluster.local`, which automatically fails over at the Nginx Ingress rules level.

So even if some server with docker-registry is unavailable, the cluster will live and download images from the HA registry.

## Prometheus

Prometheus is also a very important part of the HA cluster. It not only collects important metrics, but also has notification rules. If something goes wrong, it reports it. In our case, it reports to our Telegram chats, even if some servers are down.

We lifted kube-prometheus-stack into 3 replicas for Prometheus and Alertmanager.

For our status page we rewrote the API to Prometheus, so you can publicly see status on our status page.

## TON Nodes

The main change we made to TON nodes during this HA transition was adding a Prometheus exporter and liveness HTTP endpoint directly to the node process.

This allowed us to set up Alertmanager with node status directly in Telegram:

- Garbage collection: since what date the node has been storing data.
- MC block: when the last Master Chain block was seen in the node.
- Shard block: when the last Shard block was seen in the node.

It also allowed us to monitor load on liteservers, `td::Actor`, and other internals in Grafana, and store this data for a week to analyze problematic situations.

The liveness probe is also very important. It allowed us to configure the Kubernetes probe directly against the node process, so if there are any problems with a TON node, it is automatically rebooted.

## Kafka

Kafka is difficult to set up. We used `strimzi` plus `kafka-ui` plus `kafka-lag-exporter`.

`Strimzi` includes `cruise-control`, `zookeeper`, and `kafka-exporter`.

If a server with Kafka goes down, Kafka needs to rebalance topics with cruise-control in order to keep them up to date. Without `cruise-control`, there is no way to maintain HA Kafka.

Also, `Strimzi` works on the Kubernetes operator concept and is pretty easy to configure and manage topics with.

From the customization changes, we added:

- `jvmOptions`
- `socket.request.max.bytes` / `replica.fetch.max.bytes`

For each topic:

- `retention.ms`
- `retention.bytes`
- `max.message.bytes`

Since TON creates quite a heavy load at peak and blocks weigh a lot, it is important that Kafka does not lose messages and allows large blocks and transactions to pass through. The pods themselves also need to be configured correctly in terms of resources and `jvmOptions` to handle large messages correctly.

And of course, we configured fancy status in Telegram via Prometheus and Alertmanager.

## Redis HA

For Redis we chose the light method: 1 write point and several replicas in conjunction with Sentinel to select the actual master.

We also:

- updated the code of all index workers to work with Sentinel;
- configured backups and Prometheus metrics plus Grafana dashboards for monitoring.

Redis is one of the critical components for the index. In case of data loss, it can take up to 10 minutes for the index to be down.

Data from Redis is needed to properly handle emulation and population of network accounts, depending on their type and past data. For example: event traces, diff balances, confirming NFTs and Jettons by collections and minters for correlated blocks, and so on.

## Postgres HA

We used the Crunchy Postgres operator to create master/replica and backups. Crunchy is very simple and easy to set up.

We use PostgreSQL mainly for our Data Miners.

DataMiner is our internal concept for processing low-level data into high-level data. For example, some assets require information from different smart contracts. To correctly map them to APIs and services, we manually create one DataMiner per asset type that pulls data from ClickHouse, processes it, and saves it to PostgreSQL.

Each DataMiner is run separately and has its own protection against duplication, loss, and status with logs.

## ClickHouse HA

For ClickHouse, we used Altinity's clickhouse-operator. It is also convenient and easy to set up.

In addition, we split the index with account states per transaction, around 10 TB, and the index of actual accounts and transactions without states per transaction, around 2 TB. This will also increase query throughput and service stability.

## Conclusion

We are constantly working on improving and supporting our services. With the transition to HA build, we believe that our services will become faster, more convenient, and more stable.

## P.S.

In the setup, we made a mind map of the services and documentation of all settings for each service for easier setup and configuration.

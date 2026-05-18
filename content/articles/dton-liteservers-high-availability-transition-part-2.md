---
title: "dTON LiteServers High Availability transition, part 2"
description: "How dTON designed stable high availability infrastructure for TON LiteServer access."
publishedAt: "2025-03-21"
author: "Andrey Tvorozhkov"
sourceUrl: "https://blog.dton.io/dton-liteservers-high-availability-transition-part-2/"
---

Our company was the first to start selling shared resources to LiteServers of TON due to our custom TON node changes.

Now, when more than a year has passed and we have migrated to HA Kubernetes, we would like to share our experience of how we manage TON servers.

What our infrastructure looks like:

- 1 entry point network balancer.
- TON Node Balancers:
  - Archive.
  - Testnet.
  - Mainnet.
  - Private, for dedicated clients.
- TON Nodes.

To ensure that our clients always stay up to date, and that we can roll updates to TON Node balancers, we use a single external balancer that checks availability of TCP connections and automatically fails over to live TON Node balancers.

Each TON Node Balancer has Prometheus metrics that provide information to Grafana about balancer usage, and we receive critical alerts in Telegram in case something goes wrong.

Also, each TON Node Balancer has its own balancer tag. This tag is needed to discover TON Nodes inside the Kubernetes cluster automatically. It allows us to add and reduce TON nodes behind the balancer smoothly, because each node sends its credentials to its balancer tag, and the balancer picks up these credentials and connects to the TON node.

The main task of the TON Node Balancer is to quickly execute LiteQuery clients. For this purpose we use caching, as well as finding the node that received blocks before all others and proxying requests to it.

When the client needs to send an external message to the network, we retransmit it to all TON Nodes that are available for this balancer, and also send this message to Kafka, where it is further retransmitted to all third-party services.

Each TON Node also has a Prometheus metrics endpoint for Grafana and alerts, liveness probes, and a batch of other C++ patches, such as reducing external-message checks and retransmission on high usage.

Basically, we created stable and strong infrastructure for our clients.

If you want a private dedicated stable solution, contact us.

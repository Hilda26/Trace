# Trace — Food Safety Evidence Protocol

Trace is a GenLayer-native food safety evidence protocol built on StudioNet. It enables food chain operators to submit batch safety cases, attach evidence, and receive AI-powered safety verdicts through GenLayer's decentralised validator network.

## What It Does

- **Submit Cases** — Log food safety cases with full batch details: category, chain stage, temperature logs, inspection notes, supplier info, and more
- **Attach Evidence** — Upload URLs for images, PDFs, recall advisories, and lab reports
- **Request Verdicts** — Trigger an on-chain GenLayer consensus verdict powered by 5 independent AI validators
- **Case Room** — Restricted workspace for case owners to add internal review notes and track verdict status
- **Activity Feed** — Per-wallet history of all on-chain actions
- **Admin Monitor** — Read-only protocol observability restricted to the deployer wallet

## Verdict Fields

Each verdict produced by the GenLayer validator network includes:

| Field | Description |
|---|---|
| `safety_status` | Overall classification (e.g. proceed_with_conditions, hold_required) |
| `risk_tier` | low / medium / high / critical |
| `required_action` | Recommended next step |
| `evidence_quality` | strong / medium / weak / missing |
| `cold_chain_assessment` | Cold chain integrity assessment |
| `documentation_completeness` | Completeness of submitted documentation |
| `inspection_signal` | Signal from inspection notes |
| `confidence` | 0–100 confidence score |
| `short_reason` | One-sentence explanation of the verdict |

## Tech Stack

- **Smart Contract** — GenLayer Intelligent Contract (Python), deployed on StudioNet (Chain ID 61999)
- **Frontend** — Next.js 14, Tailwind CSS v4
- **Wallet** — Injected wallet (MetaMask / Rabby) via genlayer-js v1.1.8
- **Network** — StudioNet RPC: `https://studio.genlayer.com/api`

## Getting Started

```bash
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract_address>
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contract

The GenLayer contract is located at `contract/trace.py`. Deploy it via [GenLayer Studio](https://studio.genlayer.com) and set the resulting address in `.env.local`.

## Network

| | |
|---|---|
| Network | StudioNet |
| Chain ID | 61999 |
| RPC | https://studio.genlayer.com/api |
| Explorer | https://explorer-studio.genlayer.com |

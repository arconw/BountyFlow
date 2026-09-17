# Security

This project is intended for portfolio reviews and Ethereum testnets. It has automated security regression tests but has not undergone an independent smart-contract audit. The contract has no arbitration, deadline, or worker withdrawal flow; a creator must approve an accepted task before payment is released.

Do not use the contract for real funds without an independent audit and a deliberate product decision about disputes and locked rewards.

The Pages demo is isolated browser state and never connects a wallet or sends a transaction. The main application never requests private keys. Local EVM accounts and ETH are disposable development fixtures.

Report vulnerabilities through this repository's **Security → Report a vulnerability** form. Do not include credentials, recovery codes, private keys, or personal data in public issues. Include affected revision, reproducible steps, and the expected versus actual result.

See [deployment requirements](docs/deployment.md) for HTTPS, trusted proxy headers, database persistence, authentication configuration, and backup responsibilities.

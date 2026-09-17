for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const response = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
      signal: AbortSignal.timeout(1000),
    });
    if ((await response.json()).result === "0x7a69") process.exit(0);
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 250));
}
throw new Error("Local EVM did not become ready");

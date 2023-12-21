import { ethers } from "ethers";

const data = `data:,{"p":"asc-20","op":"mint","tick":"dino","amt":"100000000"}`;
const provider_url =
  "https://avalanche.blockpi.network/v1/rpc/58a4d6151f3488612cafa1b68e87fce06472c908";
const private_key =
  "105f729f5f979bcd4315d76235ae9adc9bff1ed7f999192deb4ec0c1aa96c4fe";

const public_key = '0xb1B85C98971c29b3555661113566829545a5f98f';

async function mint() {
  const buffer = Buffer.from(data, "utf8");
  const hexData = buffer.toString("hex");
  const provider = ethers.getDefaultProvider(provider_url);

  const wallet = new ethers.Wallet(private_key, provider);

  wallet.sendTransaction({
    from : public_key,
    to : public_key,
    data : `0x${hexData}`,
  });
}

async function main() {
  await mint();
}

main();

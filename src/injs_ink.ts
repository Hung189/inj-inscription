import {
  MsgSend,
  PrivateKey,
  BaseAccount,
  TxClient,
  TxGrpcClient,
  ChainRestAuthApi,
  createTransaction,
  ChainRestTendermintApi,
} from "@injectivelabs/sdk-ts";
import {
  DEFAULT_STD_FEE,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
  BigNumberInBase,
} from "@injectivelabs/utils";
import { ChainId } from "@injectivelabs/ts-types";
import {
  Network,
  getNetworkEndpoints,
  getNetworkInfo,
} from "@injectivelabs/networks";

// NÊN CHẠY TRƯỚC 1 VÍ CHẠY 1 LẦN RỒI LOGIN VÀO https://injs.ink/ XEM CÓ LÊN TOKEN KHÔNG THÌ MỚI CHẠY TIẾP

// !!!! CHÚ Ý !!!!
// THAY BẰNG LIST PRIVATE KEY Ở ĐÂY CÁI NÀY CỨ TẠO VÍ Ở METAMASK
// XONG IMPORT VÀO VÍ Keplr LÀ ĐƯỢC
// CÓ THỂ ĐIỀN NHIỀU VÍ VÀO ĐÂY
const privateKeyHashs = [
  "ethereum wallet private key 1",
  "ethereum wallet private key 2",
  "ethereum wallet private key 3",
];

// !!!! CHÚ Ý !!!!
// MUỐN MỖI VÍ MINT MẤY LẦN THÌ THAY SỐ VÀO ĐÂY TỐI THIỂU LÀ 1
const mintPerWallet = 1;

// CÁC THÔNG TIN Ở DƯỚI NÀY CHECK WEB NẾU KHÔNG ĐỔI THÌ KHÔNG CẦN SỬA, https://docs.injs.ink/mint-injs

// https://docs.injs.ink/mint-injs
const memo = `ZGF0YToseyJwIjoiaW5qcmMtMjAiLCJvcCI6Im1pbnQiLCJ0aWNrIjoiSU5KUyIsImFtdCI6IjEwMDAifQ==`;
// https://docs.injs.ink/mint-injs
const value = 0.0000000001;

// NẾU MUỐN CHẠY MAINNET THÌ ĐỔI 2 DÒNG DƯỚI
const chainId: any = ChainId.Testnet; // ChainId.Mainnet; //
const networkId: any = Network.Testnet; // Network.Mainnet; //

async function main() {
  try {
    const network = getNetworkInfo(networkId);

    const restEndpoint = getNetworkEndpoints(networkId).rest;

    const chainRestAuthApi = new ChainRestAuthApi(restEndpoint);

    const chainRestTendermintApi = new ChainRestTendermintApi(restEndpoint);
    console.log("restEndpoint -> ", restEndpoint);

    const amount = {
      amount: new BigNumberInBase(value).toWei().toFixed(),
      denom: "inj",
    };

    for (let i = 0; i < privateKeyHashs.length; i++) {
      const privateKeyHash = privateKeyHashs[i];
      const privateKey = PrivateKey.fromHex(privateKeyHash);
      const injectiveAddress = privateKey.toBech32();
      const pubKey = privateKey.toPublicKey().toBase64();

      const msg = MsgSend.fromJSON({
        amount,
        srcInjectiveAddress: injectiveAddress,
        dstInjectiveAddress: injectiveAddress,
      });
      for (let j = 0; j < mintPerWallet; j++) {
        console.log(`Mint ${injectiveAddress} lần thứ ${j + 1} `);

        const accountDetailsResponse = await chainRestAuthApi.fetchAccount(
          injectiveAddress
        );
        const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

        const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
        const latestHeight = latestBlock.header.height;
        const timeoutHeight = new BigNumberInBase(latestHeight).plus(
          DEFAULT_BLOCK_TIMEOUT_HEIGHT
        );

        const { txRaw, signBytes } = createTransaction({
          pubKey,
          chainId,
          fee: DEFAULT_STD_FEE,
          message: msg,
          sequence: baseAccount.sequence,
          timeoutHeight: timeoutHeight.toNumber(),
          accountNumber: baseAccount.accountNumber,
          memo,
        });

        const signature = await privateKey.sign(Buffer.from(signBytes));

        txRaw.signatures = [signature];

        /** Calculate hash of the transaction */
        console.log(`Transaction Hash: ${TxClient.hash(txRaw)}`);

        const txService = new TxGrpcClient(network.grpc);

        /** Simulate transaction */
        const simulationResponse = await txService.simulate(txRaw);
        console.log(
          `Transaction simulation response: ${JSON.stringify(
            simulationResponse.gasInfo
          )}`
        );

        /** Broadcast transaction */
        const txResponse = await txService.broadcast(txRaw);

        if (txResponse.code !== 0) {
          console.log(`Transaction failed: ${txResponse.rawLog}`);
        } else {
          console.log(
            `Broadcasted transaction hash: ${JSON.stringify(txResponse.txHash)}`
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
}

main();

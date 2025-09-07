import {
  FarcasterNetwork,
  getInsecureHubRpcClient,
  type HubAsyncResult,
  Message,
  NobleEd25519Signer,
  makeCastAdd,
  CastType,
} from '@farcaster/hub-nodejs'
import env from './env'
import { ed25519 } from '@noble/curves/ed25519'
import { fromHex, toHex, zeroAddress } from 'viem'

const HUB_URL = '3.230.187.250:3383'
const FC_NETWORK = FarcasterNetwork.MAINNET
const FID = 1356
const hubClient = getInsecureHubRpcClient(HUB_URL)

async function getSigner() {
  if (env.SIGNER_PRIVATE_KEY !== zeroAddress) {
    const privateKeyBytes = fromHex(env.SIGNER_PRIVATE_KEY, 'bytes')
    const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes)
    console.log(
      `Using existing signer with public key: ${toHex(publicKeyBytes)}`
    )
    return privateKeyBytes
  }
  throw new Error('No SIGNER_PRIVATE_KEY provided in environment variables')
}

const submitMessage = async (resultPromise: HubAsyncResult<Message>) => {
  const result = await resultPromise
  if (result.isErr()) {
    throw new Error(`Error creating message: ${result.error}`)
  }
  const messageSubmitResult = await hubClient.submitMessage(result.value)
  if (messageSubmitResult.isErr()) {
    throw new Error(
      `Error submitting message to hub: ${messageSubmitResult.error}`
    )
  }
}

export default async function publishCast(text: string) {
  console.log('Attempting to publish cast:', text)
  const signer = new NobleEd25519Signer(await getSigner())
  const dataOptions = {
    fid: FID,
    network: FC_NETWORK,
  }
  console.log('Got signer, publishing cast')
  return submitMessage(
    makeCastAdd(
      {
        text,
        embedsDeprecated: [],
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        type: CastType.CAST,
      },
      dataOptions,
      signer
    )
  )
}

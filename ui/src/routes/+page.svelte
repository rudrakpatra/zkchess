
<script>
  import { onMount } from 'svelte'
  import { Mina, PublicKey } from 'o1js'
	import ChessBoard from './ChessBoard.svelte';

  onMount(async () => {
    const { Add } = await import('../../../contracts/build/src/')
    // Update this to use the address (public key) for your zkApp account.
    // To try it out, you can try this address for an example "Add" smart contract that we've deployed to
    // Berkeley Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA .
    const zkAppAddress = ''
    // This should be removed once the zkAppAddress is updated.
    if (!zkAppAddress) {
      console.error(
        'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Berkeley Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA',
      )
    }
    //const zkApp = new Add(PublicKey.fromBase58(zkAppAddress))
  })

</script>

<svelte:head>
  <title>Mina zkChess UI</title>
</svelte:head>
<main>
  <ChessBoard/>
</main>
<style>
  main{
    width:100vw;
    height:100vh;
    display: grid;
    place-items: center;
  }
</style>


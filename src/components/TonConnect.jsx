import Container from '@/components/Container';

export default function DexPositionCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const address = urlParams.get('address');
  const jetton = urlParams.get('jetton');
  const amount = urlParams.get('amount');

  if (!address || !amount) {
    document.body.innerHTML = '<p>Error: no address or amount was found.</p>';
    throw new Error('Missing required params');
  }

  let tonLink = `ton://transfer/${address}?amount=${amount}`;
  if (jetton) {
    tonLink += `&jetton=${jetton}`;
  }

  window.location.href = tonLink;

  return (
    <Container className='flex justify-center'>
      <main className='flex flex-col space-y-4'>
        <p>Using ton:// to redirect...</p>
      </main>
    </Container>
  );
}


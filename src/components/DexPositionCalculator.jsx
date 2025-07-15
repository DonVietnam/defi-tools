import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TOKEN_A_DEFAULT = 'USDC';
const TOKEN_B_DEFAULT = 'ETH';

/** @param {CalculatePositionParamsType} params */
function calculatePosition(params) {
  const totalAmount = params.tokenAAmount + params.priceTokenAPerTokenB * params.tokenBAmount;
  const reservedAmount = params.reservedTokenAAmount + params.reservedTokenBAmount * params.priceTokenAPerTokenB;
  const totalPullTokens = totalAmount - reservedAmount;
  const tokenBToPool = totalPullTokens / (params.requiredLPTokenAPerTokenB + params.priceTokenAPerTokenB);
  const tokenAToPool = params.requiredLPTokenAPerTokenB * tokenBToPool;
  return [tokenAToPool, tokenBToPool];
}

/**
 * @param {{
 *   actionName: 'swap' | 'put' | 'borrow' | 'error';
 *   leftToken?: { name: string; value: number };
 *   rightToken?: { name: string; value: number };
 *   error?: string;
 * }[]} actions
 */
function buildMessage(actions) {
  const lines = [];
  for (const action of actions) {
    const leftTokenString = `${action.leftToken?.value} ${action.leftToken?.name}`;
    const rightTokenString = `${action.rightToken?.value} ${action.rightToken?.name}`;
    if (action.actionName === 'swap') {
      lines.push(`Swap ${leftTokenString} for ${rightTokenString}.`);
    } else if (action.actionName === 'put') {
      lines.push(`Put ${leftTokenString} and ${rightTokenString} into liquidity pool.`);
    } else if (action.actionName === 'borrow') {
      lines.push(`Borrow ${leftTokenString} for ${rightTokenString} from lending market.`);
    } else if (action.actionName === 'error') {
      lines.push(action.error);
    }
  }
  return lines.join('\n');
}

export default function DexPositionCalculator() {
  const [tokenAName, setTokenAName] = useState(TOKEN_A_DEFAULT);
  const [tokenBName, setTokenBName] = useState(TOKEN_B_DEFAULT);
  const [tokenAAmount, setTokenAAmount] = useState(0);
  const [tokenBAmount, setTokenBAmount] = useState(1);
  const [reservedTokenAAmount, setReservedTokenAAmount] = useState(0);
  const [reservedTokenBAmount, setReservedTokenBAmount] = useState(0.1);
  const [priceTokenAPerTokenB, setPriceTokenAPerTokenB] = useState(2000);
  const [requiredLPTokenAPerTokenB, setRequiredLPTokenAPerTokenB] = useState(400);
  const [message, setMessage] = useState('');

  const [useLending, setUseLending] = useState(false);
  const [collateralFactor, setCollateralFactor] = useState(0.75);
  const [borrowAsset, setBorrowAsset] = useState(tokenAName);

  useEffect(() => {
    const params = {
      tokenAAmount,
      tokenBAmount,
      reservedTokenAAmount,
      reservedTokenBAmount,
      priceTokenAPerTokenB,
      requiredLPTokenAPerTokenB
    };

    if (Object.values(params).some(val => isNaN(val))) {
      setMessage(buildMessage([{ actionName: 'error', error: 'Unable to parse incoming numbers.' }]));
      return;
    }

    const [tokenAToPool, tokenBToPool] = calculatePosition(params);

    if (tokenAToPool > tokenAAmount - reservedTokenAAmount) {
      if (useLending === true && borrowAsset === tokenAName) {
        const availableTokenA = tokenAAmount - reservedTokenAAmount;
        const remainedTokenBAmount = tokenBAmount - availableTokenA / requiredLPTokenAPerTokenB;
        params.tokenAAmount = tokenAAmount - availableTokenA;
        params.tokenBAmount = remainedTokenBAmount;
        params.priceTokenAPerTokenB = priceTokenAPerTokenB * collateralFactor;
        const [borrowedAToPool, remainedBToPull] = calculatePosition(params);
        setMessage(
          buildMessage([
            {
              actionName: 'borrow',
              leftToken: { name: tokenAName, value: borrowedAToPool },
              rightToken: { name: tokenBName, value: remainedTokenBAmount - remainedBToPull - reservedTokenBAmount }
            },
            {
              actionName: 'put',
              leftToken: { name: tokenAName, value: borrowedAToPool + availableTokenA },
              rightToken: { name: tokenBName, value: remainedBToPull + availableTokenA / requiredLPTokenAPerTokenB }
            }
          ])
        );
      } else {
        setMessage(
          buildMessage([
            {
              actionName: 'swap',
              leftToken: { name: tokenBName, value: tokenBAmount - reservedTokenBAmount - tokenBToPool },
              rightToken: { name: tokenAName, value: tokenAToPool - (tokenAAmount - reservedTokenAAmount) }
            },
            {
              actionName: 'put',
              leftToken: { name: tokenAName, value: tokenAToPool },
              rightToken: { name: tokenBName, value: tokenBToPool }
            }
          ])
        );
      }
    } else {
      if (useLending === true && borrowAsset === tokenBName) {
        const availableTokenB = tokenBAmount - reservedTokenBAmount;
        const remainedTokenAAmount = tokenAAmount - availableTokenB * requiredLPTokenAPerTokenB;
        params.tokenAAmount = tokenAAmount - remainedTokenAAmount;
        params.tokenBAmount = availableTokenB;
        params.priceTokenAPerTokenB = priceTokenAPerTokenB * (2 - collateralFactor);
        const [remainedAToPool, borrowedBToPull] = calculatePosition(params);
        setMessage(
          buildMessage([
            {
              actionName: 'borrow',
              leftToken: { name: tokenBName, value: borrowedBToPull },
              rightToken: { name: tokenAName, value: remainedTokenAAmount - remainedAToPool - reservedTokenAAmount }
            },
            {
              actionName: 'put',
              leftToken: { name: tokenBName, value: borrowedBToPull + availableTokenB },
              rightToken: { name: tokenAName, value: remainedAToPool + availableTokenB * requiredLPTokenAPerTokenB }
            }
          ])
        );
      } else {
        setMessage(
          buildMessage([
            {
              actionName: 'swap',
              leftToken: { name: tokenAName, value: tokenAAmount - reservedTokenAAmount - tokenAToPool },
              rightToken: { name: tokenBName, value: tokenBToPool - (tokenBAmount - reservedTokenBAmount) }
            },
            {
              actionName: 'put',
              leftToken: { name: tokenAName, value: tokenAToPool },
              rightToken: { name: tokenBName, value: tokenBToPool }
            }
          ])
        );
      }
    }
  }, [
    tokenAName,
    tokenBName,
    tokenAAmount,
    tokenBAmount,
    reservedTokenAAmount,
    reservedTokenBAmount,
    priceTokenAPerTokenB,
    requiredLPTokenAPerTokenB,
    borrowAsset,
    collateralFactor,
    useLending
  ]);

  return (
    <Container className='flex justify-center'>
      <main className='flex flex-col space-y-4'>
        <h3 className='scroll-m-20 text-2xl font-semibold tracking-tight'>Dex Position Calculator</h3>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]' htmlFor='token_a_name'>
            Token A Name
          </Label>
          <Input type='text' id='token_a_name' value={tokenAName} onChange={e => setTokenAName(e.target.value)} />
          <Label className='min-w-[200px]' htmlFor='token_a_amount'>
            Token A amount
          </Label>
          <Input
            type='number'
            id='token_a_amount'
            value={tokenAAmount}
            onChange={e => setTokenAAmount(e.target.valueAsNumber)}
          />
        </div>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]' htmlFor='token_b_name'>
            Token B Name
          </Label>
          <Input type='text' id='token_b_name' value={tokenBName} onChange={e => setTokenBName(e.target.value)} />
          <Label className='min-w-[200px]' htmlFor='token_b_amount'>
            Token B amount
          </Label>
          <Input
            type='number'
            id='token_b_amount'
            value={tokenBAmount}
            onChange={e => setTokenBAmount(e.target.valueAsNumber)}
          />
        </div>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]' htmlFor='reserved_a'>
            Reserved {tokenAName}{' '}
          </Label>
          <Input
            type='number'
            id='reserved_a'
            value={reservedTokenAAmount}
            onChange={e => setReservedTokenAAmount(e.target.valueAsNumber)}
          />
        </div>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]' htmlFor='reserved_b'>
            Reserved {tokenBName}{' '}
          </Label>
          <Input
            type='number'
            id='reserved_b'
            value={reservedTokenBAmount}
            onChange={e => setReservedTokenBAmount(e.target.valueAsNumber)}
          />
        </div>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]' htmlFor='price_a_per_b'>
            Price of {tokenAName} per {tokenBName}
          </Label>
          <Input
            type='number'
            id='price_a_per_b'
            value={priceTokenAPerTokenB}
            onChange={e => setPriceTokenAPerTokenB(e.target.valueAsNumber)}
          />
        </div>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]' htmlFor='lp_a_per_b'>
            Required LP of {tokenAName} per {tokenBName}
          </Label>
          <Input
            type='number'
            id='lp_a_per_b'
            value={requiredLPTokenAPerTokenB}
            onChange={e => setRequiredLPTokenAPerTokenB(e.target.valueAsNumber)}
          />
        </div>

        <div className='flex gap-4 items-center'>
          <Label className='min-w-[200px]'>Use Lending</Label>
          <input type='checkbox' checked={useLending} onChange={e => setUseLending(e.target.checked)} />
        </div>

        {useLending && (
          <>
            <div className='flex gap-4 items-center'>
              <Label className='min-w-[200px]'>Collateral Factor (e.g. 0.75)</Label>
              <Input
                type='number'
                value={collateralFactor}
                onChange={e => setCollateralFactor(e.target.valueAsNumber)}
              />
            </div>
            <div className='flex gap-4 items-center'>
              <Label className='min-w-[200px]'>Borrow Asset</Label>
              <Select value={borrowAsset} onValueChange={setBorrowAsset}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Select borrow token' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={tokenAName}>{tokenAName}</SelectItem>
                  <SelectItem value={tokenBName}>{tokenBName}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className='flex flex-col text-muted-foreground space-y-2'>
          <hr style={{ marginTop: '16px', marginBottom: '32px' }} />
          <pre className='leading-7 [&:not(:first-child)]:mt-6'>{message}</pre>
        </div>
      </main>
    </Container>
  );
}

/**
 * @typedef {{
 *   tokenAAmount: number;
 *   tokenBAmount: number;
 *   reservedTokenAAmount: number;
 *   reservedTokenBAmount: number;
 *   priceTokenAPerTokenB: number;
 *   requiredLPTokenAPerTokenB: number;
 * }} CalculatePositionParamsType
 */

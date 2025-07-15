import { Router, Route, Switch } from 'wouter';
import DexPositionCalculator from './components/DexPositionCalculator';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ApplicationSidebar from '@/components/ApplicationSidebar';
import Main from '@/components/Main';
import Container from '@/components/Container';
import { BASE_URL } from './lib/utils';

export default function App() {
  return (
    <SidebarProvider>
      <Router base={BASE_URL}>
        <ApplicationSidebar />
        <SidebarTrigger />
        <Container className='flex flex-col items-center'>
          <Switch>
            <Route path='/dex-position-calculator' component={DexPositionCalculator} />
            <Route path='/' component={Main} />
            <Route>
              <div style={{ padding: '1rem' }}>
                <h2>Not Found</h2>
                <p>The page you are looking for does not exist.</p>
              </div>
            </Route>
          </Switch>
        </Container>
      </Router>
    </SidebarProvider>
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

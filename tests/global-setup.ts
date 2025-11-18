import { server } from './fixtures/apiMocks';

export default function globalSetup() {
  server.listen({ onUnhandledRequest: 'warn' });
  console.log('🔧 MSW server started');
}

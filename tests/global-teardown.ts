import { server } from './fixtures/apiMocks';

export default function globalTeardown() {
  server.close();
  console.log('🔧 MSW server stopped');
}

import { connect } from 'services/dbService';
import { serve } from '~/app';

if (!process.env.MONGO_URL) {
  console.error('Missing MONGO_URL env variable');
} else {
  connect(process.env.MONGO_URL);
}

serve(parseInt(process.env.PORT || '8000'));

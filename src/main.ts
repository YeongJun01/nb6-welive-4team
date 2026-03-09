import app from './app';
import { PORT } from './lib/constants';

app.listen(PORT, () => {
  console.log(`team4 Server is running on port ${PORT}`);
});

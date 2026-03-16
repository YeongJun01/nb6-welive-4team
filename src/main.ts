import app from './app';
import { PORT } from './lib/constants';
import pollService from './modules/poll/poll.service';

app.listen(PORT, async () => {
  console.log(`team4 Server is running on port ${PORT}`);

  // 서버 시작 시 "투표 상태 자동 변경" 크론잡 실행
  await pollService.autoChangePollStatus();
});

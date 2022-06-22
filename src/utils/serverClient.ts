import { StreamChat } from 'stream-chat';
import { CHATBOT_ID, CHATBOT_IMAGE, CHATBOT_NAME, STREAM_API_KEY, STREAM_API_SECRET } from '@config';
import { logger } from '@utils/logger';

const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

// 로캣 챗봇 계정 업데이트 혹은 생성
serverClient
  .upsertUser({
    id: CHATBOT_ID,
    name: CHATBOT_NAME,
    image: CHATBOT_IMAGE,
  })
  .then(() => logger.info('챗봇 유저 생성 완료'));

export { serverClient };

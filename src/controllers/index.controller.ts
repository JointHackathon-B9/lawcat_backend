import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { serverClient } from '@utils/serverClient';
import { CHATBOT_ID } from '@config';

class IndexController {
  // Frontend에서 userToken을 얻기 위한 API
  public signIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(JSON.stringify(req.body));
      const token = serverClient.createToken(req.body.userId);
      console.log(token);

      res.send({
        token: token,
      });
    } catch (error) {
      next(error);
    }
  };

  // Stream Chat 서버에서 hook으로 요청을 보내는 API
  public hook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const valid = serverClient.verifyWebhook(JSON.stringify(req.body), req.header['x-signature']);

      if (!valid) {
        res.sendStatus(400);
        return;
      }

      const channelType = req.body.channel_type;
      const channelId = req.body.channel_id;
      const text = req.body.message.text;
      const userId = req.body.user.id;

      if (userId === CHATBOT_ID) {
        res.sendStatus(200);
        return;
      }

      // AI 모델 요청

      // DB 조회

      // 로캣 응답
      const channel = serverClient.channel(channelType, channelId);
      await channel.sendMessage({
        text: `AI processed message of '${text}'`,
        user_id: CHATBOT_ID,
      });

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  // 챗봇 채널을 생성하는 API
  public createBotChannel = async (req: Request, res: Response, next: NextFunction) => {
    const botChannelName = '법률 상담 챗봇 - 로캣';
    const userId = req.body.userId;

    try {
      const channel = serverClient.channel('counsel', `${CHATBOT_ID}-${userId}`, {
        name: botChannelName,
      });
      await channel.create();
    } catch (error) {
      next(error);
    }
  };

  // 채널 삭제하는 API
  public delteChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;

import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { serverClient } from '@utils/serverClient';
import { CHATBOT_AI_URI, CHATBOT_ID } from '@config';
import { randomUUID } from 'crypto';
import axios from 'axios';

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
      const channelType = req.body.channel_type;
      const channelId = req.body.channel_id;
      const text = req.body.message.text;
      const userId = req.body.user.id;
      const memberIds = req.body.members.map(m => m.user_id);
      const channel = serverClient.channel(channelType, channelId);

      // 챗봇 때문에 생기는 hook 제외
      if (userId === CHATBOT_ID || !memberIds.includes(CHATBOT_ID) || !text) {
        res.sendStatus(200);
        return;
      }

      // AI 모델 요청
      const aiResponse = await axios.post(`${CHATBOT_AI_URI}/intent`, {
        channelId: channelId,
        contents: text,
      });

      if (aiResponse.status != 200) {
        res.sendStatus(500);
        return;
      }

      // 챗봇 응답
      for (const { isLawyer, keyword, answer } of aiResponse.data.content) {
        if (isLawyer) {
          const { users } = await serverClient.queryUsers({
            teams: { $contains: 'lawyer' },
          });
          const filteredLawyers = users.filter(user => user.keyword && keyword === user.keword);

          await channel.sendMessage({
            text: answer,
            user_id: CHATBOT_ID,
            attachments: [
              {
                type: 'form',
                title: '변호사 추천',
                actions: filteredLawyers.map(lawyer => {
                  return {
                    type: 'lawyer',
                    value: lawyer.id,
                  };
                }),
              },
            ],
          });
        } else {
          await channel.sendMessage({
            text: answer,
            user_id: CHATBOT_ID,
          });
        }
      }

      // TODO: 유저 입력 막기

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  // TODO: AI 모델 처리 완료 hook API
  public aiCompleteHook = async (req: Request, res: Response, next: NextFunction) => {
    return;
  };

  // 대화 상대 변호사로 변경 및 새로운 챗봇 방 생성 API
  public addLawyerAndReleaseBot = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, lawyerId } = req.body;

    try {
      // 챗봇 채널 있는지 확인
      const channels = await serverClient.queryChannels({ type: 'counsel', members: { $eq: [userId, CHATBOT_ID] } });
      console.log(channels.length);
      if (channels.length != 1) {
        res.sendStatus(400);
        return;
      }

      // 변호사 조회
      const { users } = await serverClient.queryUsers({ id: { $in: [lawyerId] } });
      const lawyer = users[0];
      const lawyerName = lawyer.name || lawyer.last_name + lawyer.first_name;

      const channel = channels[0];

      // 채널에서 봇 추방
      await channel.removeMembers([CHATBOT_ID]);

      // 선택한 변호사 유저 추가
      await channel.addMembers([lawyerId]);
      await channel.updatePartial({ set: { name: `${lawyerName} 변호사님과의 상담` } });

      // 새로운 봇 채널 생성
      const botChannelName = '법률 상담 챗봇 - 로캣';
      const newChannel = serverClient.channel('counsel', `${userId}-` + randomUUID(), {
        name: botChannelName,
        members: [CHATBOT_ID, userId],
        created_by_id: CHATBOT_ID,
      });
      await newChannel.create();

      await channel.sendMessage({
        text: `${lawyerName} 변호사님과 연결 되었습니다.`,
        user_id: lawyerId,
      });

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  // 챗봇 채널을 생성하는 API
  public createBotChannel = async (req: Request, res: Response, next: NextFunction) => {
    const botChannelName = '법률 상담 챗봇 - 로캣';
    const { userId } = req.body;

    try {
      // 챗봇 채널 있는지 확인
      const channels = await serverClient.queryChannels({ type: 'counsel', members: { $in: [userId, CHATBOT_ID] } });
      if (channels.length > 0) {
        res.sendStatus(409);
        return;
      }

      // 없다면 새로 생성
      const channel = serverClient.channel('counsel', `${userId}-` + randomUUID(), {
        name: botChannelName,
        members: [CHATBOT_ID, userId],
        created_by_id: CHATBOT_ID,
      });
      await channel.create();

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  // 채널 삭제하는 API
  public deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.id;

      const channel = serverClient.channel('counsel', channelId);
      await channel.delete({ hard_delete: true });

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  // 변호사 추가하는 API
  public addLawyer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, keyword } = req.body;

      const response = await serverClient.upsertUser({
        id: `lawyer-${randomUUID()}`,
        name: name,
        role: 'user',
        teams: ['lawyer'],
        keyword: keyword,
      });

      res.send(response);
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;

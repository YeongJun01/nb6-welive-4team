class PollService {
  // 투표 생성
  createPoll = async (data: any) => {
    console.log('test service poll create', data);
  };

  // 투표 목록 조회
  getPollList = async (data: any) => {
    console.log('test service poll getPollList', data);
  };

  // 투표 상세 조회
  getPollInfo = async (data: any) => {
    console.log('test service poll getPollInfo', data);
  };

  // 투표 수정
  updatePoll = async (data: any) => {
    console.log('test service poll updatePoll', data);
  };

  // 투표 삭제
  deletePoll = async (data: any) => {
    console.log('test service poll deletePoll', data);
  };
}

const pollService = new PollService();

export default pollService;
